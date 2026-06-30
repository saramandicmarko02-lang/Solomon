using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Solomon.Core.Configuration;
using Solomon.Core.Services;

namespace Solomon.AdminUI;

public static class AdminUiExtensions
{
    public static IServiceCollection AddSolomonAdminUI(this IServiceCollection services)
    {
        services.AddRouting();
        return services;
    }

    public static WebApplication MapSolomonAdminUI(this WebApplication app)
    {
        app.UseDefaultFiles();
        app.UseStaticFiles();

        var api = app.MapGroup("/api");

        api.MapGet("/status", (IConfigStore config, IAgentRuntimeState state, ISystemInfoService systemInfo) =>
        {
            var settings = config.GetSettings();
            var credentials = config.GetCredentials();
            var snapshot = systemInfo.GetSnapshot();

            return Results.Ok(new
            {
                enrolled = config.IsEnrolled,
                agentId = credentials?.AgentId,
                connected = state.IsConnected,
                lastSuccessfulHeartbeat = state.LastSuccessfulHeartbeat,
                lastConnectionAttempt = state.LastConnectionAttempt,
                lastError = state.LastError,
                serverBaseUrl = settings.ServerBaseUrl,
                inputFolderPath = settings.InputFolderPath,
                adminPort = settings.AdminPort,
                heartbeatIntervalSeconds = settings.HeartbeatIntervalSeconds,
                enrollmentPath = settings.EnrollmentPath,
                paymentTraffic = settings.PaymentTraffic,
                filePrefix = settings.FilePrefix,
                solomonVersion = snapshot.SolomonVersion,
                hostname = snapshot.Hostname
            });
        });

        api.MapGet("/overview", (
            IConfigStore config,
            IAgentRuntimeState state,
            IAgentMetrics metrics,
            IJobMetricsService jobMetrics,
            IHealthCheckService healthChecks,
            ISystemInfoService systemInfo) =>
        {
            var settings = config.GetSettings();
            var credentials = config.GetCredentials();
            var snapshot = systemInfo.GetSnapshot();
            var uptime = metrics.GetUptime24h(state.IsConnected);
            var heartbeatSamples = metrics.GetHeartbeatSamples1h();
            var health = healthChecks.RunChecks();
            var disk = DiskInfoHelper.GetForPath(settings.InputFolderPath);
            var (delivered24h, failed24h) = jobMetrics.GetLast24Hours();
            var dailyStats = jobMetrics.GetDailyStats(7);

            var avgLatency = heartbeatSamples.Count > 0
                ? (int)heartbeatSamples.Where(h => h.LatencyMs.HasValue).Select(h => h.LatencyMs!.Value).DefaultIfEmpty(0).Average()
                : 0;

            return Results.Ok(new
            {
                refreshedAt = DateTimeOffset.UtcNow,
                solomonVersion = snapshot.SolomonVersion,
                connection = new
                {
                    connected = state.IsConnected,
                    statusLabel = uptime.StatusLabel,
                    uptimePercent24h = uptime.UptimePercent24h,
                    connectedSeconds24h = uptime.ConnectedSeconds,
                    disconnectedSeconds24h = uptime.DisconnectedSeconds,
                    lastStatusChangeAt = uptime.LastStatusChangeAt,
                    lastStatusLabel = uptime.StatusLabel
                },
                agent = new
                {
                    agentId = credentials?.AgentId,
                    hostname = snapshot.Hostname,
                    enrolled = config.IsEnrolled,
                    serverUrl = credentials?.WebSocketUrl ?? settings.ServerBaseUrl
                },
                heartbeat = new
                {
                    intervalSeconds = settings.HeartbeatIntervalSeconds,
                    averageLatencyMs = avgLatency,
                    samples = heartbeatSamples.Select(h => new
                    {
                        at = h.At,
                        success = h.Success,
                        latencyMs = h.LatencyMs
                    }),
                    lastError = state.LastError,
                    lastErrorAt = state.LastConnectionAttempt
                },
                health = new
                {
                    diskLabel = disk.Label,
                    diskUsedPercent = disk.UsedPercent,
                    diskUsedBytes = disk.UsedBytes,
                    diskTotalBytes = disk.TotalBytes,
                    healthChecksPassed = health.Passed,
                    healthChecksTotal = health.Total,
                    checks = health.Checks.Select(c => new { c.Id, c.Label, passed = c.Passed }),
                    detectedFolderCount = health.DetectedFolderCount
                },
                jobs = new
                {
                    delivered24h,
                    failed24h,
                    dailyStats = dailyStats.Select(d => new
                    {
                        date = d.Date,
                        delivered = d.Delivered,
                        failed = d.Failed
                    })
                }
            });
        });

        api.MapGet("/folders", (IConfigStore config, IFolderScanner scanner) =>
        {
            var settings = config.GetSettings();
            var inputRoot = settings.InputFolderPath?.Trim() ?? string.Empty;
            var folders = scanner.ScanFolderDetails(inputRoot);

            return Results.Ok(new
            {
                inputRootPath = inputRoot,
                subfolderCount = folders.Count,
                folders = folders.Select(f => new
                {
                    name = f.Name,
                    fileCount = f.FileCount,
                    lastModified = f.LastModified
                })
            });
        });

        api.MapGet("/system", (ISystemInfoService systemInfo) =>
        {
            var s = systemInfo.GetSnapshot();
            var uptime = TimeSpan.FromSeconds(s.ServiceUptimeSeconds);

            return Results.Ok(new
            {
                hostname = s.Hostname,
                machineGuid = s.MachineGuid,
                osVersion = s.OsVersion,
                architecture = s.Architecture,
                dotnetVersion = s.DotnetVersion,
                localIp = s.LocalIp,
                solomonVersion = s.SolomonVersion,
                serviceUptimeSeconds = s.ServiceUptimeSeconds,
                serviceUptime = $"{(int)uptime.TotalHours}h {uptime.Minutes}m",
                processId = s.ProcessId,
                workingSetMb = s.WorkingSetMb,
                adminPort = s.AdminPort,
                installedAt = (DateTimeOffset?)null
            });
        });

        api.MapGet("/activity", (IAgentRuntimeState state) =>
            Results.Ok(state.RecentActivity.Take(50)));

        api.MapPost("/settings", async (HttpContext http, IConfigStore config) =>
        {
            var body = await http.Request.ReadFromJsonAsync<SettingsUpdateRequest>();
            if (body is null)
            {
                return Results.BadRequest(new { error = "Invalid request body." });
            }

            var settings = config.GetSettings();

            if (!string.IsNullOrWhiteSpace(body.ServerBaseUrl))
            {
                settings.ServerBaseUrl = body.ServerBaseUrl.Trim().TrimEnd('/');
            }

            if (!string.IsNullOrWhiteSpace(body.InputFolderPath))
            {
                settings.InputFolderPath = body.InputFolderPath.Trim();
            }

            if (body.AdminPort is > 0 and < 65536)
            {
                settings.AdminPort = body.AdminPort.Value;
            }

            if (body.HeartbeatIntervalSeconds is >= 5 and <= 10)
            {
                settings.HeartbeatIntervalSeconds = body.HeartbeatIntervalSeconds.Value;
            }

            if (!string.IsNullOrWhiteSpace(body.EnrollmentPath))
            {
                settings.EnrollmentPath = body.EnrollmentPath.Trim();
            }

            if (!string.IsNullOrWhiteSpace(body.PaymentTraffic))
            {
                settings.PaymentTraffic = PaymentTrafficValues.Normalize(body.PaymentTraffic);
            }

            if (!string.IsNullOrWhiteSpace(body.FilePrefix))
            {
                var prefix = body.FilePrefix.Trim();
                if (prefix.Length > 16 || prefix.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
                {
                    return Results.BadRequest(new { error = "Invalid file prefix." });
                }

                settings.FilePrefix = prefix;
            }

            settings.Normalize();
            config.SaveSettings(settings);
            return Results.Ok(new { success = true, message = "Settings saved. Restart service if admin port changed." });
        });

        api.MapPost("/enroll", async (HttpContext http, IEnrollmentService enrollment, IConfigStore config) =>
        {
            var body = await http.Request.ReadFromJsonAsync<EnrollRequest>();
            if (body is null || string.IsNullOrWhiteSpace(body.EnrollmentCode))
            {
                return Results.BadRequest(new { error = "Enrollment code is required." });
            }

            var settings = config.GetSettings();
            var serverUrl = !string.IsNullOrWhiteSpace(body.ServerBaseUrl)
                ? body.ServerBaseUrl.Trim().TrimEnd('/')
                : settings.ServerBaseUrl;

            if (string.IsNullOrWhiteSpace(serverUrl))
            {
                return Results.BadRequest(new { error = "Server URL is required." });
            }

            var (success, error) = await enrollment.EnrollAsync(serverUrl, body.EnrollmentCode, http.RequestAborted);
            if (!success)
            {
                return Results.BadRequest(new { error });
            }

            return Results.Ok(new { success = true, message = "Enrollment successful. Agent will connect shortly." });
        });

        api.MapPost("/unenroll", (IConfigStore config, IAgentRuntimeState state) =>
        {
            config.ClearCredentials();
            state.AddActivity("warn", "Agent unenrolled via admin UI.");
            return Results.Ok(new { success = true, message = "Credentials cleared." });
        });

        return app;
    }

    private sealed class SettingsUpdateRequest
    {
        public string? ServerBaseUrl { get; init; }
        public string? InputFolderPath { get; init; }
        public int? AdminPort { get; init; }
        public int? HeartbeatIntervalSeconds { get; init; }
        public string? EnrollmentPath { get; init; }
        public string? PaymentTraffic { get; init; }
        public string? FilePrefix { get; init; }
    }

    private sealed class EnrollRequest
    {
        public string? ServerBaseUrl { get; init; }
        public string EnrollmentCode { get; init; } = string.Empty;
    }
}

internal static class DiskInfoHelper
{
    internal sealed record DiskSnapshot(string Label, double UsedPercent, long UsedBytes, long TotalBytes);

    public static DiskSnapshot GetForPath(string? folderPath)
    {
        try
        {
            var path = string.IsNullOrWhiteSpace(folderPath) ? "C:\\" : folderPath.Trim();
            if (!Path.IsPathRooted(path))
            {
                path = Path.GetFullPath(path);
            }

            var root = Path.GetPathRoot(path);
            if (string.IsNullOrWhiteSpace(root))
            {
                root = "C:\\";
            }

            var drive = DriveInfo.GetDrives().FirstOrDefault(d =>
                d.IsReady && string.Equals(d.Name, root, StringComparison.OrdinalIgnoreCase));

            if (drive is null)
            {
                return new DiskSnapshot("Disk", 0, 0, 0);
            }

            var total = drive.TotalSize;
            var free = drive.AvailableFreeSpace;
            var used = total - free;
            var pct = total > 0 ? Math.Round(used * 100.0 / total, 1) : 0;

            return new DiskSnapshot($"{drive.Name.TrimEnd('\\')}", pct, used, total);
        }
        catch
        {
            return new DiskSnapshot("Disk", 0, 0, 0);
        }
    }
}
