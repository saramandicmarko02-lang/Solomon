namespace Solomon.Core.Services;

public interface IAgentRuntimeState
{
    bool IsConnected { get; }
    DateTimeOffset? LastSuccessfulHeartbeat { get; }
    DateTimeOffset? LastConnectionAttempt { get; }
    string? LastError { get; }
    IReadOnlyList<ActivityEntry> RecentActivity { get; }

    void SetConnected(bool connected);
    void RecordHeartbeat();
    void RecordConnectionAttempt(string? error = null);
    void AddActivity(string level, string message);
}

public sealed record ActivityEntry(DateTimeOffset Timestamp, string Level, string Message);

public sealed class AgentRuntimeState : IAgentRuntimeState
{
    private readonly object _lock = new();
    private readonly List<ActivityEntry> _activity = new();
    private const int MaxActivityEntries = 100;

    public bool IsConnected { get; private set; }
    public DateTimeOffset? LastSuccessfulHeartbeat { get; private set; }
    public DateTimeOffset? LastConnectionAttempt { get; private set; }
    public string? LastError { get; private set; }

    public IReadOnlyList<ActivityEntry> RecentActivity
    {
        get
        {
            lock (_lock)
            {
                return _activity.ToList();
            }
        }
    }

    public void SetConnected(bool connected)
    {
        lock (_lock)
        {
            IsConnected = connected;
            if (connected)
            {
                LastError = null;
            }
        }
    }

    public void RecordHeartbeat()
    {
        lock (_lock)
        {
            LastSuccessfulHeartbeat = DateTimeOffset.UtcNow;
        }
    }

    public void RecordConnectionAttempt(string? error = null)
    {
        lock (_lock)
        {
            LastConnectionAttempt = DateTimeOffset.UtcNow;
            LastError = error;
        }
    }

    public void AddActivity(string level, string message)
    {
        lock (_lock)
        {
            _activity.Insert(0, new ActivityEntry(DateTimeOffset.UtcNow, level, message));
            if (_activity.Count > MaxActivityEntries)
            {
                _activity.RemoveAt(_activity.Count - 1);
            }
        }
    }
}
