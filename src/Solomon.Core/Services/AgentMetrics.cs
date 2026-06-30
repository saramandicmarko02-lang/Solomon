namespace Solomon.Core.Services;

public sealed record ConnectionSample(DateTimeOffset At, bool Connected);

public sealed record HeartbeatSample(DateTimeOffset At, bool Success, int? LatencyMs);

public sealed record UptimeStats(
    double UptimePercent24h,
    int ConnectedSeconds,
    int DisconnectedSeconds,
    DateTimeOffset? LastStatusChangeAt,
    string StatusLabel);

public interface IAgentMetrics
{
    DateTimeOffset? LastStatusChangeAt { get; }
    string CurrentStatusLabel { get; }

    void RecordConnectionState(bool connected);
    void RecordConnectionSample(bool connected);
    void RecordHeartbeat(bool success, int? latencyMs = null);

    IReadOnlyList<ConnectionSample> GetConnectionSamples24h();
    IReadOnlyList<HeartbeatSample> GetHeartbeatSamples1h();
    UptimeStats GetUptime24h(bool currentlyConnected);
}

public sealed class AgentMetrics : IAgentMetrics
{
    private readonly object _lock = new();
    private readonly List<ConnectionSample> _connectionSamples = new();
    private readonly List<HeartbeatSample> _heartbeatSamples = new();
    private static readonly TimeSpan ConnectionRetention = TimeSpan.FromHours(24);
    private static readonly TimeSpan HeartbeatRetention = TimeSpan.FromHours(1);

    public DateTimeOffset? LastStatusChangeAt { get; private set; }
    public string CurrentStatusLabel { get; private set; } = "Nepoznato";

    public void RecordConnectionState(bool connected)
    {
        lock (_lock)
        {
            var label = connected ? "Povezan" : "Offline";
            if (CurrentStatusLabel != label)
            {
                CurrentStatusLabel = label;
                LastStatusChangeAt = DateTimeOffset.UtcNow;
            }

            _connectionSamples.Add(new ConnectionSample(DateTimeOffset.UtcNow, connected));
            TrimConnectionSamples();
        }
    }

    public void RecordConnectionSample(bool connected)
    {
        lock (_lock)
        {
            _connectionSamples.Add(new ConnectionSample(DateTimeOffset.UtcNow, connected));
            TrimConnectionSamples();
        }
    }

    public void RecordHeartbeat(bool success, int? latencyMs = null)
    {
        lock (_lock)
        {
            _heartbeatSamples.Add(new HeartbeatSample(DateTimeOffset.UtcNow, success, latencyMs));
            TrimHeartbeatSamples();
        }
    }

    public IReadOnlyList<ConnectionSample> GetConnectionSamples24h()
    {
        lock (_lock)
        {
            TrimConnectionSamples();
            return _connectionSamples.ToList();
        }
    }

    public IReadOnlyList<HeartbeatSample> GetHeartbeatSamples1h()
    {
        lock (_lock)
        {
            TrimHeartbeatSamples();
            return _heartbeatSamples.ToList();
        }
    }

    public UptimeStats GetUptime24h(bool currentlyConnected)
    {
        lock (_lock)
        {
            TrimConnectionSamples();
            var now = DateTimeOffset.UtcNow;
            var windowStart = now - ConnectionRetention;

            var samples = _connectionSamples.Where(s => s.At >= windowStart).OrderBy(s => s.At).ToList();
            if (samples.Count == 0)
            {
                var connectedSec = currentlyConnected ? (int)ConnectionRetention.TotalSeconds : 0;
                var disconnectedSec = currentlyConnected ? 0 : (int)ConnectionRetention.TotalSeconds;
                var pct = currentlyConnected ? 100.0 : 0.0;
                return new UptimeStats(pct, connectedSec, disconnectedSec, LastStatusChangeAt, CurrentStatusLabel);
            }

            var connectedSeconds = 0;
            for (var i = 0; i < samples.Count; i++)
            {
                var start = samples[i].At < windowStart ? windowStart : samples[i].At;
                var end = i + 1 < samples.Count ? samples[i + 1].At : now;
                if (samples[i].Connected)
                {
                    connectedSeconds += (int)Math.Max(0, (end - start).TotalSeconds);
                }
            }

            var totalSeconds = (int)ConnectionRetention.TotalSeconds;
            var disconnectedSeconds = Math.Max(0, totalSeconds - connectedSeconds);
            var uptimePercent = totalSeconds > 0 ? connectedSeconds * 100.0 / totalSeconds : 0;

            return new UptimeStats(
                Math.Round(uptimePercent, 1),
                connectedSeconds,
                disconnectedSeconds,
                LastStatusChangeAt,
                currentlyConnected ? "Povezan" : CurrentStatusLabel);
        }
    }

    private void TrimConnectionSamples()
    {
        var cutoff = DateTimeOffset.UtcNow - ConnectionRetention;
        _connectionSamples.RemoveAll(s => s.At < cutoff);
    }

    private void TrimHeartbeatSamples()
    {
        var cutoff = DateTimeOffset.UtcNow - HeartbeatRetention;
        _heartbeatSamples.RemoveAll(s => s.At < cutoff);
    }
}
