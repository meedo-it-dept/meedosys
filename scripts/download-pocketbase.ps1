# =============================================================================
# MEEDOSys v2.0 - PocketBase Windows Binary Downloader
# Downloads and extracts the latest pocketbase.exe into the pocketbase/ directory
# =============================================================================

$version = "0.23.4"
$zipUrl = "https://github.com/pocketbase/pocketbase/releases/download/v$version/pocketbase_${version}_windows_amd64.zip"
$targetDir = "$PSScriptRoot\..\pocketbase"
$targetZip = "$targetDir\pocketbase.zip"

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "MEEDOSys v2.0 - PocketBase Downloader" -ForegroundColor Green
Write-Host "Downloading PocketBase v$version for Windows..." -ForegroundColor Yellow
Write-Host "============================================================="

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir | Out-Null
}

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Write-Host "Fetching: $zipUrl"
    Invoke-WebRequest -Uri $zipUrl -OutFile $targetZip -UseBasicParsing

    Write-Host "Extracting pocketbase.exe to $targetDir..." -ForegroundColor Yellow
    Expand-Archive -Path $targetZip -DestinationPath $targetDir -Force
    Remove-Item -Path $targetZip -Force

    Write-Host "`n✓ PocketBase v$version downloaded successfully!" -ForegroundColor Green
    Write-Host "Executable location: $targetDir\pocketbase.exe"
    Write-Host "`nTo start the PocketBase server, run:" -ForegroundColor Cyan
    Write-Host "  cd pocketbase" -ForegroundColor White
    Write-Host "  .\pocketbase.exe serve --http=""0.0.0.0:8090""" -ForegroundColor White
    Write-Host "`nAdmin UI: http://127.0.0.1:8090/_/" -ForegroundColor Yellow
}
catch {
    Write-Error "Failed to download PocketBase: $_"
}
