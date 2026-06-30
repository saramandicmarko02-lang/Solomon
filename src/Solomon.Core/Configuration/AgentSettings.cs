namespace Solomon.Core.Configuration;

public sealed class AgentSettings
{
    public const string SectionName = "Solomon";

    /// <summary>Base URL of the cloud web app, e.g. https://api.example.com</summary>
    public string ServerBaseUrl { get; set; } = string.Empty;

    /// <summary>Local admin UI port (127.0.0.1 only).</summary>
    public int AdminPort { get; set; } = 5050;

    /// <summary>Heartbeat interval in seconds (5–10 recommended).</summary>
    public int HeartbeatIntervalSeconds { get; set; } = 7;

    /// <summary>Root folder watched for subdirectories and file delivery target.</summary>
    public string InputFolderPath { get; set; } = string.Empty;

    /// <summary>Enrollment endpoint path relative to ServerBaseUrl, e.g. /agent/enroll</summary>
    public string EnrollmentPath { get; set; } = "/agent/enroll";

    /// <summary>domestic | foreign — determines default file prefix for Hal E-Bank datoteke.</summary>
    public string PaymentTraffic { get; set; } = PaymentTrafficValues.Domestic;

    /// <summary>Prefix for preuzete/poslate datoteke, npr. NA_ (domaći) ili NT_ (devizni).</summary>
    public string FilePrefix { get; set; } = FilePrefixDefaults.Domestic;

    public void Normalize()
    {
        PaymentTraffic = PaymentTrafficValues.Normalize(PaymentTraffic);
        FilePrefix = string.IsNullOrWhiteSpace(FilePrefix)
            ? FilePrefixDefaults.ForPaymentTraffic(PaymentTraffic)
            : FilePrefix.Trim();
    }
}

public sealed class StoredCredentials
{
    public string AgentId { get; set; } = string.Empty;
    public string AuthToken { get; set; } = string.Empty;
    public string WebSocketUrl { get; set; } = string.Empty;
    public string ServerBaseUrl { get; set; } = string.Empty;
}

public sealed class EnrollmentRequest
{
    public string EnrollmentCode { get; set; } = string.Empty;
}

public sealed class EnrollmentResponse
{
    public string AgentId { get; set; } = string.Empty;
    public string AuthToken { get; set; } = string.Empty;
    public string WebSocketUrl { get; set; } = string.Empty;
}
