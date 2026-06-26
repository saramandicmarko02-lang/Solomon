using System.Security.Cryptography;
using System.Text;

namespace Solomon.Core.Configuration;

/// <summary>
/// Encrypts/decrypts secrets using Windows DPAPI (CurrentUser scope).
/// Suitable for a Windows Service running under a dedicated service account
/// with its own user profile loaded.
/// </summary>
public static class DpapiProtector
{
    private static readonly byte[] Entropy = "Solomon.Agent.v1"u8.ToArray();

    public static string Protect(string plaintext)
    {
        if (OperatingSystem.IsWindows())
        {
            var bytes = Encoding.UTF8.GetBytes(plaintext);
            var protectedBytes = ProtectedData.Protect(bytes, Entropy, DataProtectionScope.CurrentUser);
            return Convert.ToBase64String(protectedBytes);
        }

        // Dev fallback on non-Windows (e.g. Mac CI) — not for production.
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(plaintext));
    }

    public static string Unprotect(string protectedBase64)
    {
        var protectedBytes = Convert.FromBase64String(protectedBase64);

        if (OperatingSystem.IsWindows())
        {
            var bytes = ProtectedData.Unprotect(protectedBytes, Entropy, DataProtectionScope.CurrentUser);
            return Encoding.UTF8.GetString(bytes);
        }

        return Encoding.UTF8.GetString(protectedBytes);
    }
}
