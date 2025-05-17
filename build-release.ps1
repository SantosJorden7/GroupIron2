# Group Ironmen Release Build Script
# This script builds the project and packages it into a release ZIP
$ErrorActionPreference = "Stop"

$version = "1.0.0"
$releaseName = "group-ironmen-v$version"
$releaseZip = "$releaseName.zip"

Write-Host "=== Building Group Ironmen v$version Release ===" -ForegroundColor Cyan

# Step 1: Navigate to the site directory
Write-Host "[1/5] Navigating to site directory..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\site"

# Step 2: Run clean script
Write-Host "[2/5] Cleaning build artifacts..." -ForegroundColor Yellow
npm run clean

# Step 3: Run production build
Write-Host "[3/5] Building production bundle..." -ForegroundColor Yellow
npm run bundle

if (-not $?) {
    Write-Host "Build failed! Aborting package creation." -ForegroundColor Red
    exit 1
}

# Step 4: Create release directory
Write-Host "[4/5] Creating release package..." -ForegroundColor Yellow
$releaseDir = "$PSScriptRoot\$releaseName"

# Remove existing release directory if it exists
if (Test-Path $releaseDir) {
    Remove-Item -Path $releaseDir -Recurse -Force
}

# Create fresh release directory
New-Item -ItemType Directory -Path $releaseDir | Out-Null

# Copy files to release directory
Copy-Item -Path "$PSScriptRoot\public" -Destination "$releaseDir\public" -Recurse
Copy-Item -Path "$PSScriptRoot\server" -Destination "$releaseDir\server" -Recurse
Copy-Item -Path "$PSScriptRoot\CHANGELOG.md" -Destination "$releaseDir\CHANGELOG.md"
Copy-Item -Path "$PSScriptRoot\README.md" -Destination "$releaseDir\README.md"
Copy-Item -Path "$PSScriptRoot\LICENSE" -Destination "$releaseDir\LICENSE"

# Step 5: Create ZIP archive
Write-Host "[5/5] Creating ZIP archive..." -ForegroundColor Yellow
Set-Location -Path $PSScriptRoot

# Remove existing zip if it exists
if (Test-Path $releaseZip) {
    Remove-Item -Path $releaseZip -Force
}

# Create the ZIP archive
Compress-Archive -Path $releaseDir\* -DestinationPath $releaseZip

# Output completion message
Write-Host "" 
Write-Host "=== Release Build Complete! ===" -ForegroundColor Green
Write-Host "Release package: $releaseZip" -ForegroundColor White
Write-Host ""
Write-Host "Release contains:" -ForegroundColor Cyan
Write-Host "- All built site files" -ForegroundColor White
Write-Host "- Server components" -ForegroundColor White
Write-Host "- CHANGELOG.md" -ForegroundColor White
Write-Host "- README.md" -ForegroundColor White
Write-Host "- LICENSE" -ForegroundColor White

# Clean up temporary release directory
Remove-Item -Path $releaseDir -Recurse -Force
