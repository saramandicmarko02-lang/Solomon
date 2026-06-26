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
        var enrollUrl = $"{baseUrl}/agent/enroll";

        try
        {
            var client = _httpClientFactory.CreateClient("SolomonEnrollment");
            var request = new EnrollmentRequest { EnrollmentCode = enrollmentCode.Trim() };
            using var response = await client.PostAsJsonAsync(enrollUrl, request, JsonOptions, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Enrollment failed: {Status} {Body}", response.StatusCode, body);
                return (false, $"Enrollment failed ({(int)response.StatusCode}).");
            }

            var result = await response.Content.ReadFromJsonAsync<EnrollmentResponse>(JsonOptions, cancellationToken);
            if (result is null || string.IsNullOrWhiteSpace(result.AgentId) || string.IsNullOrWhiteSpace(result.AuthToken))
            {
                return (false, "Invalid enrollment response from server.");
            }

            var settings = _configStore.GetSettings();
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
}
