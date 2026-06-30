namespace Solomon.Core.Services;

public sealed record FolderDetail(string Name, int FileCount, DateTimeOffset? LastModified);

public interface IFolderScanner
{
    IReadOnlyList<string> GetImmediateSubdirectories(string inputRootPath);
    IReadOnlyList<FolderDetail> ScanFolderDetails(string inputRootPath);
}

public sealed class FolderScanner : IFolderScanner
{
    public IReadOnlyList<string> GetImmediateSubdirectories(string inputRootPath)
    {
        return ScanFolderDetails(inputRootPath).Select(f => f.Name).ToList();
    }

    public IReadOnlyList<FolderDetail> ScanFolderDetails(string inputRootPath)
    {
        if (string.IsNullOrWhiteSpace(inputRootPath) || !Directory.Exists(inputRootPath))
        {
            return Array.Empty<FolderDetail>();
        }

        try
        {
            return Directory
                .GetDirectories(inputRootPath)
                .Select(dir =>
                {
                    var name = Path.GetFileName(dir);
                    if (string.IsNullOrWhiteSpace(name))
                    {
                        return null;
                    }

                    var files = Directory.GetFiles(dir, "*", SearchOption.TopDirectoryOnly);
                    DateTimeOffset? lastModified = null;
                    if (files.Length > 0)
                    {
                        var maxTicks = files.Max(f =>
                        {
                            try
                            {
                                return File.GetLastWriteTimeUtc(f).Ticks;
                            }
                            catch
                            {
                                return 0L;
                            }
                        });
                        if (maxTicks > 0)
                        {
                            lastModified = new DateTimeOffset(maxTicks, TimeSpan.Zero);
                        }
                    }

                    return new FolderDetail(name, files.Length, lastModified);
                })
                .Where(d => d is not null)
                .Select(d => d!)
                .OrderBy(d => d.Name, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
        catch
        {
            return Array.Empty<FolderDetail>();
        }
    }
}
