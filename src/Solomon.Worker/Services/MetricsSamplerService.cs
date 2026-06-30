using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Solomon.Core.Services;

namespace Solomon.Worker.Services;

public sealed class MetricsSamplerService : BackgroundService
{
    private readonly IAgentRuntimeState _runtimeState;
    private readonly IAgentMetrics _metrics;
    private readonly ILogger<MetricsSamplerService> _logger;

    public MetricsSamplerService(
        IAgentRuntimeState runtimeState,
        IAgentMetrics metrics,
        ILogger<MetricsSamplerService> logger)
    {
        _runtimeState = runtimeState;
        _metrics = metrics;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _metrics.RecordConnectionState(_runtimeState.IsConnected);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                _metrics.RecordConnectionSample(_runtimeState.IsConnected);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Metrics sampler tick failed");
            }
        }
    }
}
