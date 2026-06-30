$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$AdminUiDir = Join-Path $Root "src\Solomon.AdminUI.Web"

Write-Host "==> Building Solomon Admin UI (Next.js static export)" -ForegroundColor Cyan
Push-Location $AdminUiDir
try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw "Node.js is required to build the admin UI. Install Node.js 20 LTS or newer."
    }

    $nodeVersion = (node -v) -replace '^v', ''
    $nodeMajor = [int]($nodeVersion.Split('.')[0])
    if ($nodeMajor -lt 20) {
        throw "Node.js 20+ is required (found v$nodeVersion)."
    }

    if (-not (Test-Path "node_modules")) {
        Write-Host "    npm ci" -ForegroundColor DarkGray
        npm ci
    } else {
        Write-Host "    npm install" -ForegroundColor DarkGray
        npm install
    }

    Write-Host "    npm run build" -ForegroundColor DarkGray
    npm run build

    $wwwroot = Join-Path $Root "src\Solomon.AdminUI\wwwroot\index.html"
    if (-not (Test-Path $wwwroot)) {
        throw "Admin UI export failed: $wwwroot not found."
    }

    Write-Host "Admin UI exported to src\Solomon.AdminUI\wwwroot" -ForegroundColor Green
}
finally {
    Pop-Location
}
