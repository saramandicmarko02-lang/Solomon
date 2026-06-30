using Solomon.Core.Configuration;

namespace Solomon.Core.Services;

public sealed record HealthCheckItem(string Id, string Label, bool Passed);

public sealed record HealthCheckResult(
    int Passed,
    int Total,
    IReadOnlyList<HealthCheckItem> Checks,
    int DetectedFolderCount);

public interface IHealthCheckService
{
    HealthCheckResult RunChecks();
}

public sealed class HealthCheckService : IHealthCheckService
{
    private readonly IConfigStore _configStore;
    private readonly IFolderScanner _folderScanner;

    public HealthCheckService(IConfigStore configStore, IFolderScanner folderScanner)
    {
        _configStore = configStore;
        _folderScanner = folderScanner;
    }

    public HealthCheckResult RunChecks()
    {
        var settings = _configStore.GetSettings();
        var inputPath = settings.InputFolderPath?.Trim() ?? string.Empty;
        var checks = new List<HealthCheckItem>();

        var exists = !string.IsNullOrWhiteSpace(inputPath) && Directory.Exists(inputPath);
        checks.Add(new HealthCheckItem("input-exists", "Input folder postoji", exists));

        var canWrite = false;
        if (exists)
        {
            try
            {
                var probe = Path.Combine(inputPath, $".solomon-health-{Guid.NewGuid():N}.tmp");
                File.WriteAllText(probe, "ok");
                File.Delete(probe);
                canWrite = true;
            }
            catch
            {
                canWrite = false;
            }
        }

        checks.Add(new HealthCheckItem("input-write", "Write permisije", canWrite));

        var configReadable = true;
        try
        {
            _ = _configStore.GetSettings();
        }
        catch
        {
            configReadable = false;
        }

        checks.Add(new HealthCheckItem("config-readable", "Konfiguracija čitljiva", configReadable));
        checks.Add(new HealthCheckItem("service-running", "Servis aktivan", true));

        var folders = _folderScanner.GetImmediateSubdirectories(inputPath);
        var passed = checks.Count(c => c.Passed);

        return new HealthCheckResult(passed, checks.Count, checks, folders.Count);
    }
}
