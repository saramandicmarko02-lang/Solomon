#Requires -RunAsAdministrator
param(
    [string]$ServiceName = "Solomon Agent",
    [string]$InstallDir = "${env:ProgramFiles}\Solomon"
)

$ErrorActionPreference = "Stop"

$svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($svc) {
    if ($svc.Status -eq "Running") {
        Stop-Service -Name $ServiceName -Force
    }
    sc.exe delete $ServiceName | Out-Null
    Write-Host "Service removed."
}

if (Test-Path $InstallDir) {
    Remove-Item -Path $InstallDir -Recurse -Force
    Write-Host "Removed $InstallDir"
}

Write-Host "Solomon Agent uninstalled."
