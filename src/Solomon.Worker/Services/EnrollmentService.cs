using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Solomon.Core.Configuration;
using Solomon.Core.Services;

namespace Solomon.Worker.Services;

public sealed class EnrollmentService : IEnrollmentService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfigStore _configStore;
    private readonly ILogger<EnrollmentService> _logger;

    public EnrollmentService(
        IHttpClientFactory httpClientFactory,
        IConfigStore configStore,
        ILogger<EnrollmentService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configStore = configStore;
        _logger = logger;
    }

    public async Task<(bool Success, string? Error)> EnrollAsync(
        string serverBaseUrl,
        string enrollmentCode,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(serverBaseUrl))
        {
            return (false, "Server URL is required.");
        }

        if (string.IsNullOrWhiteSpace(enrollmentCode))
        {
            return (false, "Enrollment code is required.");
        }

        var baseUrl = serverBaseUrl.TrimEnd('/');
        var settings = _configStore.GetSettings();
        var enrollPath = string.IsNullOrWhiteSpace(settings.EnrollmentPath) ? "/agent/enroll" : settings.EnrollmentPath.Trim();
        if (!enrollPath.StartsWith('/'))
        {
            enrollPath = "/" + enrollPath;
        }

        var enrollUrl = $"{baseUrl}{enrollPath}";

        try
        {
            var client = _httpClientFactory.CreateClient("SolomonEnrollment");
            var request = new EnrollmentRequest { EnrollmentCode = enrollmentCode.Trim() };
            using var response = await client.PostAsJsonAsync(enrollUrl, request, JsonOptions, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Enrollment failed: {Status} {Url} {Body}", response.StatusCode, enrollUrl, body);

                var hint = response.StatusCode == System.Net.HttpStatusCode.MethodNotAllowed
                    ? " Server ne prihvata POST na ovoj putanji — proverite API base URL (ne frontend URL) i enrollment putanju."
                    : string.Empty;

                var detail = string.IsNullOrWhiteSpace(body) ? string.Empty : $" Odgovor: {Truncate(body, 200)}";
                return (false, $"Enrollment failed ({(int)response.StatusCode}) na {enrollUrl}.{hint}{detail}");
            }

            var result = await response.Content.ReadFromJsonAsync<EnrollmentResponse>(JsonOptions, cancellationToken);
            if (result is null || string.IsNullOrWhiteSpace(result.AgentId) || string.IsNullOrWhiteSpace(result.AuthToken))
            {
                return (false, "Invalid enrollment response from server.");
            }

            settings.ServerBaseUrl = baseUrl;
            _configStore.SaveSettings(settings);

            _configStore.SaveCredentials(new StoredCredentials
            {
                AgentId = result.AgentId,
                AuthToken = result.AuthToken,
                WebSocketUrl = result.WebSocketUrl,
                ServerBaseUrl = baseUrl
            });

            _logger.LogInformation("Agent enrolled successfully as {AgentId}", result.AgentId);
            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Enrollment request failed");
            return (false, ex.Message);
        }
    }

    private static string Truncate(string value, int maxLength)
    {
        if (value.Length <= maxLength)
        {
            return value;
        }

        return value[..maxLength] + "...";
    }
}
