using System.Text.Json.Serialization;

namespace Solomon.Core.Protocol;

public static class MessageTypes
{
    public const string Heartbeat = "heartbeat";
    public const string JobDispatch = "job_dispatch";
    public const string JobStatus = "job_status";
}

public sealed class HeartbeatMessage
{
    [JsonPropertyName("type")]
    public string Type { get; init; } = MessageTypes.Heartbeat;

    [JsonPropertyName("agentId")]
    public required string AgentId { get; init; }

    [JsonPropertyName("timestamp")]
    public required string Timestamp { get; init; }

    [JsonPropertyName("inputFolders")]
    public required IReadOnlyList<string> InputFolders { get; init; }

    /// <summary>Configured Input root path on the agent machine (optional but recommended).</summary>
    [JsonPropertyName("inputRootPath")]
    public string? InputRootPath { get; init; }
}

public sealed class JobDispatchMessage
{
    [JsonPropertyName("type")]
    public string Type { get; init; } = MessageTypes.JobDispatch;

    [JsonPropertyName("jobId")]
    public required string JobId { get; init; }

    [JsonPropertyName("targetFolder")]
    public string? TargetFolder { get; init; }

    [JsonPropertyName("fileName")]
    public required string FileName { get; init; }

    [JsonPropertyName("content")]
    public required string Content { get; init; }

    [JsonPropertyName("encoding")]
    public string? Encoding { get; init; }
}

public sealed class JobStatusMessage
{
    [JsonPropertyName("type")]
    public string Type { get; init; } = MessageTypes.JobStatus;

    [JsonPropertyName("jobId")]
    public required string JobId { get; init; }

    [JsonPropertyName("status")]
    public required string Status { get; init; }

    [JsonPropertyName("error")]
    public string? Error { get; init; }
}

public static class JobStatusValues
{
    public const string Delivered = "delivered";
    public const string Failed = "failed";
}

public sealed class InboundMessageEnvelope
{
    [JsonPropertyName("type")]
    public string? Type { get; init; }
}
