# Android APK build — PGfy Tenant

**Package name:** `com.kumarsunil17.tenant`  
**EAS project:** [@kumarsunil17/pgfy-tenant](https://expo.dev/accounts/kumarsunil17/projects/pgfy-tenant)  
**Project ID:** `5e813d62-a636-48e3-a39d-8442867202c0`

## Prerequisites

- Node.js 18+
- [Android Studio](https://developer.android.com/studio) with **Android SDK** and **JDK 17**
- `ANDROID_HOME` set (Android Studio → Settings → Android SDK shows the path)

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
```

> **Disk space:** Gradle downloads several GB on the first build. If your system disk is low, the local build script stores caches on `/Volumes/Sunil_WD1/.gradle` automatically. Override with `GRADLE_USER_HOME` if needed.

## Option A — Local build (no EAS quota)

Use this when the Expo free-plan Android build quota is exhausted.

1. From `tenant-app/`:

   ```bash
   npm install
   npm run build:apk:local
   ```

2. APK output (dated filename in `dist/`):

   ```
   dist/PGfy_tenant_DD_MM_YY.apk
   ```

   Example: `dist/PGfy_tenant_12_06_26.apk`

3. Install on a connected phone (USB debugging on):

   ```bash
   adb install -r dist/PGfy_tenant_12_06_26.apk
   ```

### Other local commands

| Command | What it does |
|---------|----------------|
| `npm run prebuild:android` | Regenerate `android/` from `app.json` |
| `npm run build:apk:gradle:debug` | Gradle debug APK (requires existing `android/`) |
| `npm run build:apk:local:release` | **Signed** release APK (uses the production keystore) |
| `npm run android` | Build + run on emulator/device via Expo |

### Release signing

Release builds are signed with the production upload key. The signing setup is
durable across `expo prebuild` (which regenerates / wipes `android/`):

- **Keystore + passwords:** `credentials/release.keystore` and
  `credentials/keystore.properties`. This folder is **gitignored** — never commit it.
  Keep a secure backup; losing it means you can no longer update the app on Play.
- **Config plugin:** `plugins/withAndroidSigning.js` (registered in `app.json` →
  `expo.plugins`). On every prebuild it copies the keystore into `android/` and points
  the `release` build type at it. If the keystore is missing it falls back to the debug
  key, so dev builds still work.

Key fingerprint (verify with `keytool -list -v -keystore credentials/release.keystore`):

```
Alias: key0
SHA1:  EE:96:46:D3:8F:3C:82:34:65:C9:2B:17:57:6E:3E:F0:B2:28:7B:33
```

Build a signed release APK:

```bash
npm run build:apk:local:release
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

Confirm a build is signed with the production key:

```bash
cd android && ./gradlew :app:signingReport   # release variant → Alias: key0
```

## Option B — EAS Build (cloud)

Requires EAS CLI and available build quota:

```bash
npm install -g eas-cli
eas login
npm run build:apk        # preview APK
npm run build:apk:prod   # production APK
```

Download the `.apk` from the [Expo dashboard](https://expo.dev) when the build finishes.

## Verify package name

After prebuild, confirm:

- `app.json` → `expo.android.package`
- `android/app/build.gradle` → `applicationId 'com.kumarsunil17.tenant'`

## Version bumps

- App version: `app.json` → `expo.version`
- Android build number: `app.json` → `expo.android.versionCode` (increment for each Play Store / APK upload)
