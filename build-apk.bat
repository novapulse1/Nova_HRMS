@echo off
echo ======================================================================
echo          NOVAPULSE HRMS - ANDROID APK BUILD ENGINE
echo ======================================================================
echo.

echo [1/4] Building Web Application Distribution...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Web application build failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Syncing Assets to Android Native Project...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Capacitor Android sync failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Checking Android Build Environment (Java / Gradle)...
where javac >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ======================================================================
    echo [NOTE] Java Development Kit (JDK 17 or 21) was not found in PATH.
    echo.
    echo TO GENERATE THE APK FILE:
    echo 1. Open Android Studio
    echo 2. Click 'Open an Existing Project'
    echo 3. Select folder: %~dp0android
    echo 4. Go to Menu: Build -> Build Bundle(s) / APK(s) -> Build APK(s)
    echo 5. Android Studio will generate the APK at:
    echo    android\app\build\outputs\apk\debug\app-debug.apk
    echo ======================================================================
    echo.
    pause
    exit /b 0
)

echo.
echo [4/4] Compiling Debug APK via Gradle...
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================================
    echo [SUCCESS] APK Generated Successfully!
    echo Location: %~dp0android\app\build\outputs\apk\debug\app-debug.apk
    echo ======================================================================
) else (
    echo [ERROR] Gradle APK assembly failed. Please open the android folder in Android Studio.
)
cd ..
pause
