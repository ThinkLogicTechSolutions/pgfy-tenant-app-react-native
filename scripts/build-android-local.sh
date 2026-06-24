#!/usr/bin/env bash
# Build an installable Android APK locally (no EAS quota).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VARIANT="${1:-release}"
# Environment baked into the bundle (development|staging|production). See app.config.ts.
export APP_ENV="${2:-${APP_ENV:-production}}"
cd "$ROOT"

APP_NAME="PGfy_Tenant"
APP_SLUG="tenant"
TASK="assembleDebug"
APK_REL="android/app/build/outputs/apk/debug/app-debug.apk"

if [[ "$VARIANT" == "release" ]]; then
  TASK="assembleRelease"
  APK_REL="android/app/build/outputs/apk/release/app-release.apk"
elif [[ "$VARIANT" != "debug" ]]; then
  echo "Usage: $0 [debug|release] [development|staging|production]"
  exit 1
fi

echo "==> $APP_NAME — local Android build ($VARIANT, APP_ENV=$APP_ENV)"

if ! command -v java >/dev/null 2>&1; then
  echo "ERROR: Java not found. Install JDK 17 (bundled with Android Studio)."
  exit 1
fi

if [[ -z "${ANDROID_HOME:-}" && -z "${ANDROID_SDK_ROOT:-}" ]]; then
  if [[ -d "$HOME/Library/Android/sdk" ]]; then
    export ANDROID_HOME="$HOME/Library/Android/sdk"
  else
    echo "ERROR: ANDROID_HOME is not set."
    echo '  export ANDROID_HOME="$HOME/Library/Android/sdk"'
    echo "  export PATH=\"\$ANDROID_HOME/platform-tools:\$PATH\""
    exit 1
  fi
fi

echo "ANDROID_HOME=${ANDROID_HOME:-$ANDROID_SDK_ROOT}"

# Gradle caches can exceed 5 GB; default to the project drive if unset.
export GRADLE_USER_HOME="${GRADLE_USER_HOME:-/Volumes/Sunil_WD1/.gradle}"
mkdir -p "$GRADLE_USER_HOME"
echo "GRADLE_USER_HOME=$GRADLE_USER_HOME"

if [[ ! -d "$ROOT/android" ]]; then
  echo "==> Generating android/ via expo prebuild..."
  npm run prebuild:android
fi

echo "==> Gradle $TASK (first run downloads SDK deps; allow several minutes)..."
(cd android && ./gradlew "$TASK" --no-daemon)

APK="$ROOT/$APK_REL"
if [[ -f "$APK" ]]; then
  DATE_STAMP="$(date +%d_%m_%y)"
  DIST_DIR="$ROOT/dist"
  OUTPUT_NAME="PGfy_${APP_SLUG}_${DATE_STAMP}.apk"
  OUTPUT_APK="$DIST_DIR/$OUTPUT_NAME"
  mkdir -p "$DIST_DIR"
  cp "$APK" "$OUTPUT_APK"

  echo ""
  echo "APK ready:"
  echo "  $OUTPUT_APK"
  ls -lh "$OUTPUT_APK"
  echo ""
  echo "Gradle output (unchanged):"
  echo "  $APK"
  echo ""
  echo "Install on a connected device:"
  echo "  adb install -r \"$OUTPUT_APK\""
else
  echo "ERROR: APK not found at $APK_REL"
  exit 1
fi
