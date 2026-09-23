# NovaPulse HRMS — PowerShell Android APK Generator Script
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "          NOVAPULSE HRMS - ANDROID APK BUILD ENGINE" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Building Web Application Distribution..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Web application build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/4] Syncing Assets to Android Native Project..." -ForegroundColor Green
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Capacitor sync failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/4] Checking Java & Gradle Environment..." -ForegroundColor Green
$javaCmd = Get-Command javac -ErrorAction SilentlyContinue

if (-not $javaCmd) {
    Write-Host ""
    Write-Host "======================================================================" -ForegroundColor Yellow
    Write-Host "[INFO] Java Development Kit (JDK 17/21) is not in PATH." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "TO BUILD THE APK:" -ForegroundColor Cyan
    Write-Host "Option 1 (Recommended):" -ForegroundColor White
    Write-Host "  1. Open Android Studio."
    Write-Host "  2. Choose 'Open Project' and select: $PSScriptRoot\android"
    Write-Host "  3. Click 'Build' -> 'Build Bundle(s) / APK(s)' -> 'Build APK(s)'."
    Write-Host "  4. Output APK location: $PSScriptRoot\android\app\build\outputs\apk\debug\app-debug.apk"
    Write-Host ""
    Write-Host "Option 2 (Command Line with JDK):" -ForegroundColor White
    Write-Host "  Install JDK 17, then run: cd android; ./gradlew assembleDebug"
    Write-Host "======================================================================" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "[4/4] Compiling Debug APK with Gradle..." -ForegroundColor Green
Set-Location "$PSScriptRoot\android"
& .\gradlew.bat assembleDebug

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "======================================================================" -ForegroundColor Green
    Write-Host "[SUCCESS] APK Generated Successfully!" -ForegroundColor Green
    Write-Host "Location: $PSScriptRoot\android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White
    Write-Host "======================================================================" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Gradle build failed. Open $PSScriptRoot\android in Android Studio." -ForegroundColor Red
}
Set-Location "$PSScriptRoot"
