#!/bin/sh

# Fail immediately if a command exits with a non-zero status
set -e

echo "=== Navigating to React Native project root ==="
cd "$CI_PRIMARY_REPOSITORY_PATH"

echo "=== Installing Node.js, Yarn, and CocoaPods ==="
export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
brew install node@20 yarn cocoapods
brew link node@20 --force --overwrite

echo "=== Installing JavaScript Dependencies ==="
# Use yarn install or npm ci depending on your package manager
yarn install --frozen-lockfile

echo "=== Installing CocoaPods Dependencies ==="
npx expo prebuild --platform ios

export APP_ENV=production
export NODE_ENV=production

cd ios
pod install