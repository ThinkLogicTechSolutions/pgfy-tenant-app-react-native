#!/bin/sh
# Xcode Cloud runs this right after cloning the repo, before any CocoaPods/xcodebuild step.
# Must live at ios/ci_scripts/ (same level as the .xcodeproj/.xcworkspace) and be executable.
set -e

echo "→ repo root: $CI_PRIMARY_REPOSITORY_PATH"
cd "$CI_PRIMARY_REPOSITORY_PATH"

echo "→ node: $(command -v node) ($(node -v))"
echo "→ npm: $(command -v npm) ($(npm -v))"

echo "→ installing JS dependencies (npm ci; also runs the patch-package postinstall)"
npm ci

# Xcode Cloud is used for App Store / TestFlight builds, so default to the production API
# unless a workflow explicitly overrides APP_ENV (App Store Connect → Xcode Cloud → workflow →
# Environment). The auto-generated "Bundle React Native code and images" build phase sources
# ios/.xcode.env then ios/.xcode.env.local before invoking Metro — exporting a var here in
# ci_post_clone.sh does NOT reach that later, separate xcodebuild process, so write it to
# .xcode.env.local instead, which that phase does source.
: "${APP_ENV:=production}"
echo "→ APP_ENV=$APP_ENV (writing to ios/.xcode.env.local for the bundler phase)"
cat > "$CI_PRIMARY_REPOSITORY_PATH/ios/.xcode.env.local" <<ENVLOCAL
export APP_ENV=$APP_ENV
export NODE_ENV=production
ENVLOCAL

echo "→ installing CocoaPods dependencies"
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install

echo "→ ci_post_clone done"
