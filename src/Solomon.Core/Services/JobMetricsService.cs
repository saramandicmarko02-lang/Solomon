namespace Solomon.Core.Services;

public sealed record JobDayCount(string Date, int Delivered, int Failed);

public interface IJobMetricsService
{
    void RecordDelivered();
    void RecordFailed();
    IReadOnlyList<JobDayCount> GetDailyStats(int days = 7);
    (int Delivered24h, int Failed24h) GetLast24Hours();
}

public sealed class JobMetricsService : IJobMetricsService
{
    private readonly object _lock = new();
    private readonly Dictionary<string, (int Delivered, int Failed)> _byDay = new();

    public void RecordDelivered() => Record(success: true);

    public void RecordFailed() => Record(success: false);

    public IReadOnlyList<JobDayCount> GetDailyStats(int days = 7)
    {
        lock (_lock)
        {
            PruneOld(days);
            var result = new List<JobDayCount>();
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            for (var i = days - 1; i >= 0; i--)
            {
                var date = today.AddDays(-i);
                var key = date.ToString("yyyy-MM-dd");
                _byDay.TryGetValue(key, out var counts);
                result.Add(new JobDayCount(key, counts.Delivered, counts.Failed));
            }

            return result;
        }
    }

    public (int Delivered24h, int Failed24h) GetLast24Hours()
    {
        lock (_lock)
        {
            var todayKey = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
            _byDay.TryGetValue(todayKey, out var counts);
            return (counts.Delivered, counts.Failed);
        }
    }

    private void Record(bool success)
    {
        lock (_lock)
        {
            var key = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
            _byDay.TryGetValue(key, out var counts);
            if (success)
            {
                counts.Delivered++;
            }
            else
            {
                counts.Failed++;
            }

            _byDay[key] = counts;
            PruneOld(7);
        }
    }

    private void PruneOld(int keepDays)
    {
        var cutoff = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-keepDays);
        foreach (var key in _byDay.Keys.Where(k => DateOnly.Parse(k) < cutoff).ToList())
        {
            _byDay.Remove(key);
        }
    }
}
