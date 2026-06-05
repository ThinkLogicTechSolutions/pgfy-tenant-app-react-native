# Android APK build — PGfy Tenant

**Package name:** `com.kumarsunil17.tenant`  
**EAS project:** [@kumarsunil17/pgfy-tenant](https://expo.dev/accounts/kumarsunil17/projects/pgfy-tenant)  
**Project ID:** `5e813d62-a636-48e3-a39d-8442867202c0`

## Prerequisites

- Node.js 18+
- [EAS CLI](https://docs.expo.dev/build/setup/): `npm install -g eas-cli`
- Expo account: `eas login`
- For local builds: Android Studio + JDK 17

## Option A — EAS Build (recommended)

1. From `tenant-app-1/`:

   ```bash
   npm install
   eas login
   ```

   First-time only (already done for this repo):

   ```bash
   eas init --force --non-interactive
   ```

   EAS requires a git repo in `tenant-app-1/` (`git init` + at least one commit).

2. Build an installable APK:

   ```bash
   npm run build:apk
   ```

   Or production profile:

   ```bash
   npm run build:apk:prod
   ```

3. Download the `.apk` from the [Expo dashboard](https://expo.dev) when the build finishes.

Profiles are defined in `eas.json` (`preview` / `production` use `buildType: "apk"`).

## Option B — Local Gradle build

1. Generate the native Android project (if `android/` is missing):

   ```bash
   npm run prebuild:android
   ```

2. Debug APK (no release keystore required):

   ```bash
   cd android && ./gradlew assembleDebug
   ```

   Output: `android/app/build/outputs/apk/debug/app-debug.apk`

3. Release APK requires a signing keystore. Configure `android/app/build.gradle` signing configs, then:

   ```bash
   cd android && ./gradlew assembleRelease
   ```

   Output: `android/app/build/outputs/apk/release/app-release.apk`

## Verify package name

After prebuild, confirm:

- `app.json` → `expo.android.package`
- `android/app/build.gradle` → `applicationId 'com.kumarsunil17.tenant'`

## Version bumps

- App version: `app.json` → `expo.version`
- Android build number: `app.json` → `expo.android.versionCode` (increment for each Play Store / APK upload)
