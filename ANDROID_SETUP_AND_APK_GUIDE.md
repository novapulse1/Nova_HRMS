# NovaPulse HRMS — Android Application & APK Build Guide

This guide explains how **NovaPulse HRMS** is configured as a cross-platform Android mobile application using Capacitor, and how to build, test, and install the `.apk` on Android phones and tablets.

---

## 📱 Android App Overview & Configuration

- **Application Name**: `NovaPulse HRMS`
- **Application ID / Package**: `com.novapulse.hrms`
- **Branding & Theme**: NovaPulse Royal Purple (`#3b0764` / `#6b21a8`)
- **Native Wrapper**: Capacitor 6 with Android SDK 34 support
- **Project Location**: `android/` directory in the root workspace

### Configured Android Permissions (`AndroidManifest.xml`):
1. `INTERNET` & `ACCESS_NETWORK_STATE` — Real-time cloud sync with HRMS database
2. `ACCESS_FINE_LOCATION` & `ACCESS_COARSE_LOCATION` — GPS-based attendance clock-in & geofence perimeter checking
3. `CAMERA` — Profile photo capture & document uploads
4. `READ_EXTERNAL_STORAGE` & `WRITE_EXTERNAL_STORAGE` — Document attachment & payslip downloads
5. `POST_NOTIFICATIONS` & `VIBRATE` — Real-time in-app and push alert notifications
6. `usesCleartextTraffic="true"` — Local network & intranet compatibility

---

## 🛠 Option 1: Build APK using Android Studio (Recommended)

1. Open **Android Studio**.
2. Click **Open an Existing Project**.
3. Select the `android` folder located at:
   ```
   c:\Users\Yatender\Desktop\HRMS SOFT\android
   ```
4. Wait for Gradle to perform initial sync (1–2 minutes).
5. From the top menu, click:
   **Build** ➔ **Build Bundle(s) / APK(s)** ➔ **Build APK(s)**.
6. Once complete, click the **locate** popup notification.
7. Your generated APK will be at:
   ```
   android\app\build\outputs\apk\debug\app-debug.apk
   ```

---

## 💻 Option 2: 1-Click Command Line Build

Run the included automated build script:

### Via Command Prompt:
```cmd
build-apk.bat
```

### Via PowerShell:
```powershell
.\build-apk.ps1
```

*(Requires Java JDK 17 or 21 installed on your system)*

---

## 📲 How to Install the APK on an Android Device

1. Copy `app-debug.apk` to your phone via USB cable, Google Drive, or WhatsApp.
2. On your Android phone, tap the `.apk` file to install.
3. If prompted with *"Install unknown apps"*, tap **Settings** and enable **Allow from this source**.
4. Tap **Install** and open **NovaPulse HRMS**.
5. Grant Location & Camera permissions when requested to enable GPS clock-in.

---

## 🌐 Instant PWA Mobile Installation (No Build Tools Required)

You can also install NovaPulse directly on any Android phone without compilation:
1. Open Chrome on Android and browse to `http://<your-pc-ip>:3000`.
2. Tap the Chrome menu (three dots `⋮`) ➔ **Add to Home screen** or **Install App**.
3. NovaPulse HRMS will launch in full-screen standalone app mode with native icon and splash screen.

---

## 🔄 Generating Future Updates

Whenever you make changes to React components or modules:
```bash
npm run build
npx cap sync android
```
Then re-run the build in Android Studio to produce the updated APK.
