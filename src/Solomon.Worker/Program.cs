using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;
using Solomon.AdminUI;
using Solomon.Core.Configuration;
using Solomon.Core.Services;
using Solomon.Worker.Services;

Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

var logDirectory = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
    "Solomon",
    "logs");
Directory.CreateDirectory(logDirectory);

Log.Logger = new LoggerConfiguration()
    .WriteTo.File(
        Path.Combine(logDirectory, "solomon-.log"),
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 14)
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseWindowsService(options =>
    {
        options.ServiceName = "Solomon Agent";
    });

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.File(
            Path.Combine(logDirectory, "solomon-.log"),
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 14));

    var configStore = new ConfigStore();
    var settings = configStore.GetSettings();

    builder.Services.AddSingleton<IConfigStore>(configStore);
    builder.Services.AddSingleton<IAgentRuntimeState, AgentRuntimeState>();
    builder.Services.AddSingleton<IAgentMetrics, AgentMetrics>();
    builder.Services.AddSingleton<IJobMetricsService, JobMetricsService>();
    builder.Services.AddSingleton<IHealthCheckService, HealthCheckService>();
    builder.Services.AddSingleton<ISystemInfoService, SystemInfoService>();
    builder.Services.AddSingleton<IFolderScanner, FolderScanner>();
    builder.Services.AddSingleton<IJobWriter, JobWriter>();
    builder.Services.AddHttpClient("SolomonEnrollment", client =>
    {
        client.Timeout = TimeSpan.FromSeconds(30);
    });
    builder.Services.AddSingleton<IEnrollmentService, EnrollmentService>();
    builder.Services.AddHostedService<WebSocketAgentService>();
    builder.Services.AddHostedService<MetricsSamplerService>();

    builder.Services.AddSolomonAdminUI();

    var adminPort = settings.AdminPort > 0 ? settings.AdminPort : 5050;
    builder.WebHost.UseUrls($"http://127.0.0.1:{adminPort}");

    var app = builder.Build();
    app.MapSolomonAdminUI();

    Log.Information("Solomon Agent starting — admin UI at http://127.0.0.1:{Port}", adminPort);
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Solomon Agent terminated unexpectedly");
    throw;
}
finally
{
    await Log.CloseAndFlushAsync();
}
