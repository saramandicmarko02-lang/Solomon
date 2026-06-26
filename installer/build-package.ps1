$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$PublishDir = Join-Path $Root "publish\Solomon.Worker"
$DistDir = Join-Path $Root "dist"
$Version = "1.0.0"
$ZipName = "SolomonAgent-$Version-win-x64.zip"
$ZipPath = Join-Path $DistDir $ZipName

Write-Host "==> Restoring and publishing Solomon.Worker (win-x64, self-contained)" -ForegroundColor Cyan
Push-Location $Root
try {
    dotnet restore Solomon.sln
    dotnet publish src\Solomon.Worker\Solomon.Worker.csproj `
        -c Release `
        -r win-x64 `
        --self-contained true `
        -p:PublishSingleFile=false `
        -o $PublishDir

    if (-not (Test-Path $PublishDir)) {
        throw "Publish output not found: $PublishDir"
    }

    New-Item -ItemType Directory -Force -Path $DistDir | Out-Null

    $StageDir = Join-Path $DistDir "stage"
    if (Test-Path $StageDir) { Remove-Item $StageDir -Recurse -Force }
    New-Item -ItemType Directory -Force -Path $StageDir | Out-Null

    Copy-Item -Path (Join-Path $PublishDir "*") -Destination $StageDir -Recurse -Force
    Copy-Item -Path (Join-Path $Root "installer\Install-Solomon.ps1") -Destination $StageDir
    Copy-Item -Path (Join-Path $Root "installer\Uninstall-Solomon.ps1") -Destination $StageDir
    Copy-Item -Path (Join-Path $Root "installer\INSTALL.txt") -Destination $StageDir

    if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
    Compress-Archive -Path (Join-Path $StageDir "*") -DestinationPath $ZipPath -Force
    Remove-Item $StageDir -Recurse -Force

    Write-Host ""
    Write-Host "Package created:" -ForegroundColor Green
    Write-Host "  $ZipPath"
    Write-Host ""
    Write-Host "Transfer to Windows Server, extract, then run as Administrator:"
    Write-Host "  .\Install-Solomon.ps1"
    Write-Host ""

    $iscc = @(
        "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
        "${env:ProgramFiles}\Inno Setup 6\ISCC.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1

    if ($iscc) {
        Write-Host "==> Building Inno Setup installer" -ForegroundColor Cyan
        & $iscc (Join-Path $Root "installer\solomon.iss")
        Write-Host "Inno Setup EXE created in dist\" -ForegroundColor Green
    } else {
        Write-Host "Inno Setup not found — ZIP package is ready. Install Inno Setup 6 to also build .exe installer." -ForegroundColor Yellow
    }
}
finally {
    Pop-Location
}
