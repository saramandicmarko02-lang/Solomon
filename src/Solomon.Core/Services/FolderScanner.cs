namespace Solomon.Core.Services;

public interface IFolderScanner
{
    IReadOnlyList<string> GetImmediateSubdirectories(string inputRootPath);
}

public sealed class FolderScanner : IFolderScanner
{
    public IReadOnlyList<string> GetImmediateSubdirectories(string inputRootPath)
    {
        if (string.IsNullOrWhiteSpace(inputRootPath) || !Directory.Exists(inputRootPath))
        {
            return Array.Empty<string>();
        }

        try
        {
            return Directory
                .GetDirectories(inputRootPath)
                .Select(Path.GetFileName)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Select(name => name!)
                .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
        catch
        {
            return Array.Empty<string>();
        }
    }
}
