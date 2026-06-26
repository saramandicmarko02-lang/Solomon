#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Installs Solomon Agent as a Windows Service on Windows 10/11 and Server 2019/2022/2025.

.DESCRIPTION
  Run from an elevated PowerShell prompt inside the extracted package folder.
  Example:
    Expand-Archive SolomonAgent-1.0.0-win-x64.zip -DestinationPath C:\Temp\Solomon
    cd C:\Temp\Solomon
    .\Install-Solomon.ps1
#>
param(
    [string]$InstallDir = "${env:ProgramFiles}\Solomon",
    [string]$ServiceName = "Solomon Agent",
    [int]$AdminPort = 5050
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
    Write-Host "==> $Message" -ForegroundColor Cyan
}

$SourceDir = $PSScriptRoot
$ExeName = "Solomon.Worker.exe"
$ExePath = Join-Path $SourceDir $ExeName

if (-not (Test-Path $ExePath)) {
    throw "Solomon.Worker.exe not found in $SourceDir. Extract the full package first."
}

Write-Step "Creating install directory: $InstallDir"
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

Write-Step "Copying files"
Copy-Item -Path (Join-Path $SourceDir "*") -Destination $InstallDir -Recurse -Force

$InstalledExe = Join-Path $InstallDir $ExeName
$LogDir = Join-Path $env:ProgramData "Solomon\logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Step "Stopping existing service"
    if ($existing.Status -eq "Running") {
        Stop-Service -Name $ServiceName -Force
    }
    Write-Step "Removing existing service registration"
    sc.exe delete $ServiceName | Out-Null
    Start-Sleep -Seconds 2
}

Write-Step "Registering Windows Service"
$binPath = "`"$InstalledExe`""
sc.exe create $ServiceName binPath= $binPath start= auto DisplayName= $ServiceName | Out-Null
sc.exe description $ServiceName "Bridges cloud web app with local file-drop folder for back-office integration." | Out-Null

# Recovery: restart service on failure
sc.exe failure $ServiceName reset= 86400 actions= restart/60000/restart/60000/restart/60000 | Out-Null

Write-Step "Starting service"
Start-Service -Name $ServiceName
Start-Sleep -Seconds 3

$svc = Get-Service -Name $ServiceName
if ($svc.Status -ne "Running") {
    Write-Warning "Service is not running. Check logs in $LogDir"
} else {
    Write-Host "Service started successfully." -ForegroundColor Green
}

$adminUrl = "http://127.0.0.1:$AdminPort/"
Write-Host ""
Write-Host "Solomon Agent installed." -ForegroundColor Green
Write-Host "Admin panel: $adminUrl"
Write-Host "Logs: $LogDir"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Open admin panel in browser on this server"
Write-Host "  2. Enter cloud app URL and Input folder path"
Write-Host "  3. Enter enrollment code from your web application"
Write-Host ""

try {
    Start-Process $adminUrl
} catch {
    Write-Host "Open $adminUrl manually in your browser."
}
