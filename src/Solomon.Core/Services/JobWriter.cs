using System.Text;
using Microsoft.Extensions.Logging;
using Solomon.Core.Configuration;
using Solomon.Core.Protocol;

namespace Solomon.Core.Services;

public interface IJobWriter
{
    Task<(bool Success, string? Error)> WriteJobAsync(
        JobDispatchMessage job,
        string inputRootPath,
        string? filePrefix,
        CancellationToken cancellationToken);
}

public sealed class JobWriter : IJobWriter
{
    private readonly ILogger<JobWriter> _logger;

    public JobWriter(ILogger<JobWriter> logger)
    {
        _logger = logger;
    }

    public async Task<(bool Success, string? Error)> WriteJobAsync(
        JobDispatchMessage job,
        string inputRootPath,
        string? filePrefix,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(inputRootPath))
        {
            return (false, "Input folder is not configured.");
        }

        var fileName = FileNaming.ApplyPrefix(job.FileName, filePrefix);
        if (string.IsNullOrWhiteSpace(fileName) || fileName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
        {
            return (false, "Invalid file name.");
        }

        try
        {
            var targetDir = ResolveTargetDirectory(inputRootPath, job.TargetFolder);
            Directory.CreateDirectory(targetDir);

            var finalPath = Path.Combine(targetDir, fileName);
            var tempPath = Path.Combine(targetDir, $".{job.JobId}.{fileName}.tmp");

            var encoding = ResolveEncoding(job.Encoding);
            await File.WriteAllTextAsync(tempPath, job.Content, encoding, cancellationToken);

            if (File.Exists(finalPath))
            {
                File.Delete(finalPath);
            }

            File.Move(tempPath, finalPath);

            _logger.LogInformation("Job {JobId} delivered to {Path}", job.JobId, finalPath);
            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to write job {JobId}", job.JobId);
            return (false, ex.Message);
        }
    }

    private static string ResolveTargetDirectory(string inputRootPath, string? targetFolder)
    {
        if (string.IsNullOrWhiteSpace(targetFolder))
        {
            return inputRootPath;
        }

        var combined = Path.GetFullPath(Path.Combine(inputRootPath, targetFolder));
        var rootFull = Path.GetFullPath(inputRootPath);

        if (!combined.StartsWith(rootFull, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Target folder escapes Input root.");
        }

        return combined;
    }

    private static Encoding ResolveEncoding(string? encodingName)
    {
        if (string.IsNullOrWhiteSpace(encodingName))
        {
            encodingName = "windows-1250";
        }

        try
        {
            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
            return Encoding.GetEncoding(encodingName);
        }
        catch
        {
            return Encoding.UTF8;
        }
    }
}
