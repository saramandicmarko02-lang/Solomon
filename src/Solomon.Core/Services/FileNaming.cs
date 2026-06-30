namespace Solomon.Core.Services;

public static class FileNaming
{
    public static string ApplyPrefix(string fileName, string? prefix)
    {
        if (string.IsNullOrWhiteSpace(fileName) || string.IsNullOrWhiteSpace(prefix))
        {
            return fileName;
        }

        var trimmedPrefix = prefix.Trim();
        if (fileName.StartsWith(trimmedPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return fileName;
        }

        return trimmedPrefix + fileName;
    }
}
