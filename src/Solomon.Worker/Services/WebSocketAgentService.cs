using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Solomon.Core.Configuration;
using Solomon.Core.Protocol;
using Solomon.Core.Services;

namespace Solomon.Worker.Services;

public sealed class WebSocketAgentService : BackgroundService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    private readonly IConfigStore _configStore;
    private readonly IFolderScanner _folderScanner;
    private readonly IJobWriter _jobWriter;
    private readonly IAgentRuntimeState _runtimeState;
    private readonly ILogger<WebSocketAgentService> _logger;

    private int _backoffSeconds = 1;
    private const int MaxBackoffSeconds = 60;

    public WebSocketAgentService(
        IConfigStore configStore,
        IFolderScanner folderScanner,
        IJobWriter jobWriter,
        IAgentRuntimeState runtimeState,
        ILogger<WebSocketAgentService> logger)
    {
        _configStore = configStore;
        _folderScanner = folderScanner;
        _jobWriter = jobWriter;
        _runtimeState = runtimeState;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Solomon WebSocket agent starting");

        while (!stoppingToken.IsCancellationRequested)
        {
            var credentials = _configStore.GetCredentials();
            if (credentials is null || string.IsNullOrWhiteSpace(credentials.WebSocketUrl))
            {
                _runtimeState.SetConnected(false);
                _runtimeState.RecordConnectionAttempt("Not enrolled — configure via admin UI.");
                await DelaySafe(TimeSpan.FromSeconds(5), stoppingToken);
                continue;
            }

            try
            {
                await RunConnectionLoopAsync(credentials, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "WebSocket connection loop failed");
                _runtimeState.SetConnected(false);
                _runtimeState.RecordConnectionAttempt(ex.Message);
                _runtimeState.AddActivity("error", ex.Message);
            }

            if (stoppingToken.IsCancellationRequested)
            {
                break;
            }

            var delay = TimeSpan.FromSeconds(_backoffSeconds);
            _backoffSeconds = Math.Min(_backoffSeconds * 2, MaxBackoffSeconds);
            _logger.LogInformation("Reconnecting in {Seconds}s", delay.TotalSeconds);
            await DelaySafe(delay, stoppingToken);
        }

        _runtimeState.SetConnected(false);
        _logger.LogInformation("Solomon WebSocket agent stopped");
    }

    private async Task RunConnectionLoopAsync(StoredCredentials credentials, CancellationToken stoppingToken)
    {
        using var socket = new ClientWebSocket();
        socket.Options.KeepAliveInterval = TimeSpan.FromSeconds(30);
        socket.Options.SetRequestHeader("Authorization", $"Bearer {credentials.AuthToken}");

        _runtimeState.RecordConnectionAttempt();
        _logger.LogInformation("Connecting to {Url}", credentials.WebSocketUrl);

        await socket.ConnectAsync(new Uri(credentials.WebSocketUrl), stoppingToken);

        _backoffSeconds = 1;
        _runtimeState.SetConnected(true);
        _runtimeState.AddActivity("info", "Connected to cloud server.");
        _logger.LogInformation("WebSocket connected");

        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
        var receiveTask = ReceiveLoopAsync(socket, linkedCts.Token);
        var heartbeatTask = HeartbeatLoopAsync(socket, credentials, linkedCts.Token);

        var completed = await Task.WhenAny(receiveTask, heartbeatTask);
        linkedCts.Cancel();

        try
        {
            await Task.WhenAll(
                receiveTask.ContinueWith(_ => { }, TaskScheduler.Default),
                heartbeatTask.ContinueWith(_ => { }, TaskScheduler.Default));
        }
        catch
        {
            // Expected on disconnect.
        }

        if (socket.State is WebSocketState.Open or WebSocketState.CloseReceived)
        {
            try
            {
                await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Shutdown", CancellationToken.None);
            }
            catch
            {
                // Ignore close errors.
            }
        }

        _runtimeState.SetConnected(false);
        _runtimeState.AddActivity("warn", "Disconnected from cloud server.");

        if (completed.IsFaulted)
        {
            throw completed.Exception?.InnerException ?? completed.Exception!;
        }
    }

    private async Task HeartbeatLoopAsync(ClientWebSocket socket, StoredCredentials credentials, CancellationToken cancellationToken)
    {
        var settings = _configStore.GetSettings();
        var interval = TimeSpan.FromSeconds(Math.Clamp(settings.HeartbeatIntervalSeconds, 5, 10));

        while (!cancellationToken.IsCancellationRequested && socket.State == WebSocketState.Open)
        {
            settings = _configStore.GetSettings();
            var folders = _folderScanner.GetImmediateSubdirectories(settings.InputFolderPath);

            var heartbeat = new HeartbeatMessage
            {
                AgentId = credentials.AgentId,
                Timestamp = DateTime.UtcNow.ToString("O"),
                InputFolders = folders
            };

            await SendJsonAsync(socket, heartbeat, cancellationToken);
            _runtimeState.RecordHeartbeat();
            _logger.LogDebug("Heartbeat sent with {Count} folders", folders.Count);

            await Task.Delay(interval, cancellationToken);
        }
    }

    private async Task ReceiveLoopAsync(ClientWebSocket socket, CancellationToken cancellationToken)
    {
        var buffer = new byte[8192];
        using var messageStream = new MemoryStream();

        while (!cancellationToken.IsCancellationRequested && socket.State == WebSocketState.Open)
        {
            messageStream.SetLength(0);
            WebSocketReceiveResult result;

            do
            {
                result = await socket.ReceiveAsync(buffer, cancellationToken);
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    return;
                }

                messageStream.Write(buffer, 0, result.Count);
            }
            while (!result.EndOfMessage);

            var json = Encoding.UTF8.GetString(messageStream.ToArray());
            await HandleInboundMessageAsync(socket, json, cancellationToken);
        }
    }

    private async Task HandleInboundMessageAsync(ClientWebSocket socket, string json, CancellationToken cancellationToken)
    {
        InboundMessageEnvelope? envelope;
        try
        {
            envelope = JsonSerializer.Deserialize<InboundMessageEnvelope>(json, JsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Invalid inbound message");
            return;
        }

        if (envelope?.Type == MessageTypes.JobDispatch)
        {
            var job = JsonSerializer.Deserialize<JobDispatchMessage>(json, JsonOptions);
            if (job is null)
            {
                return;
            }

            await ProcessJobAsync(socket, job, cancellationToken);
        }
    }

    private async Task ProcessJobAsync(ClientWebSocket socket, JobDispatchMessage job, CancellationToken cancellationToken)
    {
        _runtimeState.AddActivity("info", $"Job received: {job.JobId} → {job.FileName}");
        var settings = _configStore.GetSettings();
        var (success, error) = await _jobWriter.WriteJobAsync(job, settings.InputFolderPath, cancellationToken);

        var status = new JobStatusMessage
        {
            JobId = job.JobId,
            Status = success ? JobStatusValues.Delivered : JobStatusValues.Failed,
            Error = error
        };

        await SendJsonAsync(socket, status, cancellationToken);

        _runtimeState.AddActivity(
            success ? "info" : "error",
            success ? $"Job {job.JobId} delivered." : $"Job {job.JobId} failed: {error}");
    }

    private static async Task SendJsonAsync<T>(ClientWebSocket socket, T payload, CancellationToken cancellationToken)
    {
        var json = JsonSerializer.Serialize(payload, JsonOptions);
        var bytes = Encoding.UTF8.GetBytes(json);
        await socket.SendAsync(bytes, WebSocketMessageType.Text, endOfMessage: true, cancellationToken);
    }

    private static async Task DelaySafe(TimeSpan delay, CancellationToken cancellationToken)
    {
        try
        {
            await Task.Delay(delay, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // Expected on shutdown.
        }
    }
}
