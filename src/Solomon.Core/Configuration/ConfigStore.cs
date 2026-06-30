using System.Text.Json;

namespace Solomon.Core.Configuration;

public interface IConfigStore
{
    AgentSettings GetSettings();
    void SaveSettings(AgentSettings settings);
    StoredCredentials? GetCredentials();
    void SaveCredentials(StoredCredentials credentials);
    void ClearCredentials();
    bool IsEnrolled { get; }
}

public sealed class ConfigStore : IConfigStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly string _dataDirectory;
    private readonly object _lock = new();
    private AgentSettings _settings;
    private StoredCredentials? _credentials;

    public ConfigStore(string? dataDirectory = null)
    {
        _dataDirectory = dataDirectory ?? GetDefaultDataDirectory();
        Directory.CreateDirectory(_dataDirectory);
        _settings = LoadSettingsFromDisk();
        _credentials = LoadCredentialsFromDisk();
    }

    public bool IsEnrolled => _credentials is { AgentId: not "" };

    public AgentSettings GetSettings()
    {
        lock (_lock)
        {
            _settings.Normalize();
            return CloneSettings(_settings);
        }
    }

    public void SaveSettings(AgentSettings settings)
    {
        lock (_lock)
        {
            _settings = CloneSettings(settings);
            _settings.Normalize();
            var path = Path.Combine(_dataDirectory, "settings.json");
            File.WriteAllText(path, JsonSerializer.Serialize(_settings, JsonOptions));
        }
    }

    public StoredCredentials? GetCredentials()
    {
        lock (_lock)
        {
            return _credentials is null ? null : CloneCredentials(_credentials);
        }
    }

    public void SaveCredentials(StoredCredentials credentials)
    {
        lock (_lock)
        {
            _credentials = CloneCredentials(credentials);
            var encrypted = new EncryptedCredentialsFile
            {
                AgentId = credentials.AgentId,
                AuthTokenProtected = DpapiProtector.Protect(credentials.AuthToken),
                WebSocketUrl = credentials.WebSocketUrl,
                ServerBaseUrl = credentials.ServerBaseUrl
            };
            var path = Path.Combine(_dataDirectory, "credentials.json");
            File.WriteAllText(path, JsonSerializer.Serialize(encrypted, JsonOptions));
        }
    }

    public void ClearCredentials()
    {
        lock (_lock)
        {
            _credentials = null;
            var path = Path.Combine(_dataDirectory, "credentials.json");
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
    }

    private AgentSettings LoadSettingsFromDisk()
    {
        var path = Path.Combine(_dataDirectory, "settings.json");
        if (!File.Exists(path))
        {
            return new AgentSettings();
        }

        try
        {
            var json = File.ReadAllText(path);
            return JsonSerializer.Deserialize<AgentSettings>(json, JsonOptions) ?? new AgentSettings();
        }
        catch
        {
            return new AgentSettings();
        }
    }

    private StoredCredentials? LoadCredentialsFromDisk()
    {
        var path = Path.Combine(_dataDirectory, "credentials.json");
        if (!File.Exists(path))
        {
            return null;
        }

        try
        {
            var json = File.ReadAllText(path);
            var encrypted = JsonSerializer.Deserialize<EncryptedCredentialsFile>(json, JsonOptions);
            if (encrypted is null || string.IsNullOrWhiteSpace(encrypted.AuthTokenProtected))
            {
                return null;
            }

            return new StoredCredentials
            {
                AgentId = encrypted.AgentId,
                AuthToken = DpapiProtector.Unprotect(encrypted.AuthTokenProtected),
                WebSocketUrl = encrypted.WebSocketUrl,
                ServerBaseUrl = encrypted.ServerBaseUrl
            };
        }
        catch
        {
            return null;
        }
    }

    private static string GetDefaultDataDirectory()
    {
        var programData = Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData);
        return Path.Combine(programData, "Solomon");
    }

    private static AgentSettings CloneSettings(AgentSettings s) => new()
    {
        ServerBaseUrl = s.ServerBaseUrl,
        AdminPort = s.AdminPort,
        HeartbeatIntervalSeconds = s.HeartbeatIntervalSeconds,
        InputFolderPath = s.InputFolderPath,
        EnrollmentPath = s.EnrollmentPath,
        PaymentTraffic = s.PaymentTraffic,
        FilePrefix = s.FilePrefix
    };

    private static StoredCredentials CloneCredentials(StoredCredentials c) => new()
    {
        AgentId = c.AgentId,
        AuthToken = c.AuthToken,
        WebSocketUrl = c.WebSocketUrl,
        ServerBaseUrl = c.ServerBaseUrl
    };

    private sealed class EncryptedCredentialsFile
    {
        public string AgentId { get; set; } = string.Empty;
        public string AuthTokenProtected { get; set; } = string.Empty;
        public string WebSocketUrl { get; set; } = string.Empty;
        public string ServerBaseUrl { get; set; } = string.Empty;
    }
}
