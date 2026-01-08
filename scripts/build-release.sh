#!/bin/bash

# Script to build Android release bundle for Google Play Store

set -e  # Exit on error

echo "🚀 Building Android Release Bundle for Google Play Store"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.." || exit 1

# Check if keystore exists
KEYSTORE_PATH="android/app/household-routine-manager-release.keystore"
KEYSTORE_PROPERTIES="android/keystore.properties"

if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "❌ Error: Keystore not found!"
    echo "   Run: ./scripts/generate-keystore.sh first"
    exit 1
fi

if [ ! -f "$KEYSTORE_PROPERTIES" ]; then
    echo "❌ Error: keystore.properties not found!"
    echo "   Copy android/keystore.properties.template to android/keystore.properties"
    echo "   and fill in your keystore passwords"
    exit 1
fi

echo "📦 Step 1: Building web assets..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build web assets"
    exit 1
fi

echo ""
echo "🔄 Step 2: Syncing Capacitor..."
npm run cap:sync

if [ $? -ne 0 ]; then
    echo "❌ Failed to sync Capacitor"
    exit 1
fi

echo ""
echo "🤖 Step 3: Building Android App Bundle..."
cd android
./gradlew bundleRelease

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📱 Your release bundle is ready:"
    echo "   android/app/build/outputs/bundle/release/app-release.aab"
    echo ""
    echo "📤 Next steps:"
    echo "   1. Go to Google Play Console: https://play.google.com/console"
    echo "   2. Create a new release"
    echo "   3. Upload the .aab file"
    echo "   4. See GOOGLE_PLAY_PUBLISH_GUIDE.md for complete instructions"
    echo ""
else
    echo "❌ Build failed"
    exit 1
fi

