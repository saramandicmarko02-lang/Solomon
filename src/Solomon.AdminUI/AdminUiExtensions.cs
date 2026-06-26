using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Solomon.Core.Configuration;
using Solomon.Core.Services;

namespace Solomon.AdminUI;

public static class AdminUiExtensions
{
    public static IServiceCollection AddSolomonAdminUI(this IServiceCollection services)
    {
        services.AddRouting();
        return services;
    }

    public static WebApplication MapSolomonAdminUI(this WebApplication app)
    {
        app.UseDefaultFiles();
        app.UseStaticFiles();

        var api = app.MapGroup("/api");

        api.MapGet("/status", (IConfigStore config, IAgentRuntimeState state) =>
        {
            var settings = config.GetSettings();
            var credentials = config.GetCredentials();

            return Results.Ok(new
            {
                enrolled = config.IsEnrolled,
                agentId = credentials?.AgentId,
                connected = state.IsConnected,
                lastSuccessfulHeartbeat = state.LastSuccessfulHeartbeat,
                lastConnectionAttempt = state.LastConnectionAttempt,
                lastError = state.LastError,
                serverBaseUrl = settings.ServerBaseUrl,
                inputFolderPath = settings.InputFolderPath,
                adminPort = settings.AdminPort,
                heartbeatIntervalSeconds = settings.HeartbeatIntervalSeconds,
                enrollmentPath = settings.EnrollmentPath
            });
        });

        api.MapGet("/activity", (IAgentRuntimeState state) =>
            Results.Ok(state.RecentActivity.Take(50)));

        api.MapPost("/settings", async (HttpContext http, IConfigStore config) =>
        {
            var body = await http.Request.ReadFromJsonAsync<SettingsUpdateRequest>();
            if (body is null)
            {
                return Results.BadRequest(new { error = "Invalid request body." });
            }

            var settings = config.GetSettings();

            if (!string.IsNullOrWhiteSpace(body.ServerBaseUrl))
            {
                settings.ServerBaseUrl = body.ServerBaseUrl.Trim().TrimEnd('/');
            }

            if (!string.IsNullOrWhiteSpace(body.InputFolderPath))
            {
                settings.InputFolderPath = body.InputFolderPath.Trim();
            }

            if (body.AdminPort is > 0 and < 65536)
            {
                settings.AdminPort = body.AdminPort.Value;
            }

            if (body.HeartbeatIntervalSeconds is >= 5 and <= 10)
            {
                settings.HeartbeatIntervalSeconds = body.HeartbeatIntervalSeconds.Value;
            }

            if (!string.IsNullOrWhiteSpace(body.EnrollmentPath))
            {
                settings.EnrollmentPath = body.EnrollmentPath.Trim();
            }

            config.SaveSettings(settings);
            return Results.Ok(new { success = true, message = "Settings saved. Restart service if admin port changed." });
        });

        api.MapPost("/enroll", async (HttpContext http, IEnrollmentService enrollment, IConfigStore config) =>
        {
            var body = await http.Request.ReadFromJsonAsync<EnrollRequest>();
            if (body is null || string.IsNullOrWhiteSpace(body.EnrollmentCode))
            {
                return Results.BadRequest(new { error = "Enrollment code is required." });
            }

            var settings = config.GetSettings();
            var serverUrl = !string.IsNullOrWhiteSpace(body.ServerBaseUrl)
                ? body.ServerBaseUrl.Trim().TrimEnd('/')
                : settings.ServerBaseUrl;

            if (string.IsNullOrWhiteSpace(serverUrl))
            {
                return Results.BadRequest(new { error = "Server URL is required." });
            }

            var (success, error) = await enrollment.EnrollAsync(serverUrl, body.EnrollmentCode, http.RequestAborted);
            if (!success)
            {
                return Results.BadRequest(new { error });
            }

            return Results.Ok(new { success = true, message = "Enrollment successful. Agent will connect shortly." });
        });

        api.MapPost("/unenroll", (IConfigStore config, IAgentRuntimeState state) =>
        {
            config.ClearCredentials();
            state.AddActivity("warn", "Agent unenrolled via admin UI.");
            return Results.Ok(new { success = true, message = "Credentials cleared." });
        });

        return app;
    }

    private sealed class SettingsUpdateRequest
    {
        public string? ServerBaseUrl { get; init; }
        public string? InputFolderPath { get; init; }
        public int? AdminPort { get; init; }
        public int? HeartbeatIntervalSeconds { get; init; }
        public string? EnrollmentPath { get; init; }
    }

    private sealed class EnrollRequest
    {
        public string? ServerBaseUrl { get; init; }
        public string EnrollmentCode { get; init; } = string.Empty;
    }
}
