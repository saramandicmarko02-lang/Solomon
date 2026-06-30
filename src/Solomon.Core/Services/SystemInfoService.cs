using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.InteropServices;
using Microsoft.Win32;
using Solomon.Core.Configuration;

namespace Solomon.Core.Services;

public sealed record SystemInfoSnapshot(
    string Hostname,
    string? MachineGuid,
    string OsVersion,
    string Architecture,
    string DotnetVersion,
    string? LocalIp,
    string SolomonVersion,
    long ServiceUptimeSeconds,
    int ProcessId,
    double WorkingSetMb,
    int AdminPort);

public interface ISystemInfoService
{
    SystemInfoSnapshot GetSnapshot();
    DateTimeOffset ProcessStartedAt { get; }
}

public sealed class SystemInfoService : ISystemInfoService
{
    private readonly IConfigStore _configStore;
    private static readonly DateTimeOffset StartedAt = DateTimeOffset.UtcNow;

    public SystemInfoService(IConfigStore configStore)
    {
        _configStore = configStore;
    }

    public DateTimeOffset ProcessStartedAt => StartedAt;

    public SystemInfoSnapshot GetSnapshot()
    {
        var settings = _configStore.GetSettings();
        var process = Process.GetCurrentProcess();

        return new SystemInfoSnapshot(
            Hostname: Environment.MachineName,
            MachineGuid: TryGetMachineGuid(),
            OsVersion: RuntimeInformation.OSDescription,
            Architecture: RuntimeInformation.OSArchitecture.ToString(),
            DotnetVersion: RuntimeInformation.FrameworkDescription,
            LocalIp: TryGetLocalIp(),
            SolomonVersion: GetSolomonVersion(),
            ServiceUptimeSeconds: (long)(DateTimeOffset.UtcNow - StartedAt).TotalSeconds,
            ProcessId: process.Id,
            WorkingSetMb: Math.Round(process.WorkingSet64 / 1024.0 / 1024.0, 1),
            AdminPort: settings.AdminPort > 0 ? settings.AdminPort : 5050);
    }

    private static string GetSolomonVersion()
    {
        var assembly = Assembly.GetEntryAssembly() ?? Assembly.GetExecutingAssembly();
        var info = assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion;
        if (!string.IsNullOrWhiteSpace(info))
        {
            return info.Split('+')[0];
        }

        return assembly.GetName().Version?.ToString(3) ?? "1.0.0";
    }

    private static string? TryGetMachineGuid()
    {
        if (!OperatingSystem.IsWindows())
        {
            return null;
        }

        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Cryptography");
            return key?.GetValue("MachineGuid") as string;
        }
        catch
        {
            return null;
        }
    }

    private static string? TryGetLocalIp()
    {
        try
        {
            foreach (var address in Dns.GetHostAddresses(Dns.GetHostName()))
            {
                if (address.AddressFamily == AddressFamily.InterNetwork && !IPAddress.IsLoopback(address))
                {
                    return address.ToString();
                }
            }
        }
        catch
        {
            // ignore
        }

        return null;
    }
}
