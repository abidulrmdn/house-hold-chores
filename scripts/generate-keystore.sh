#!/bin/bash

# Script to generate Android release keystore
# This keystore is required for publishing to Google Play Store

echo "🔐 Generating Android Release Keystore"
echo ""
echo "This will create a keystore file for signing your Android app."
echo "You'll need this keystore for ALL future app updates, so keep it safe!"
echo ""

# Navigate to android/app directory
cd "$(dirname "$0")/../android/app" || exit 1

KEYSTORE_NAME="household-routine-manager-release.keystore"
KEYSTORE_ALIAS="household-routine-manager"

# Check if keystore already exists
if [ -f "$KEYSTORE_NAME" ]; then
    echo "⚠️  WARNING: Keystore file already exists!"
    echo "   File: $KEYSTORE_NAME"
    read -p "   Do you want to overwrite it? (yes/no): " overwrite
    if [ "$overwrite" != "yes" ]; then
        echo "❌ Aborted. Keeping existing keystore."
        exit 1
    fi
fi

echo "📝 You'll be asked to enter:"
echo "   1. Keystore password (remember this!)"
echo "   2. Key password (can be same as keystore password)"
echo "   3. Your name and organization details"
echo ""

# Generate keystore
keytool -genkey -v \
    -keystore "$KEYSTORE_NAME" \
    -alias "$KEYSTORE_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Keystore generated successfully!"
    echo ""
    echo "📦 Next steps:"
    echo "   1. Create android/keystore.properties file with your passwords"
    echo "   2. See GOOGLE_PLAY_PUBLISH_GUIDE.md for details"
    echo ""
    echo "⚠️  IMPORTANT:"
    echo "   - Backup this keystore file securely!"
    echo "   - Store passwords in a password manager"
    echo "   - You'll need this keystore for all future updates"
    echo ""
else
    echo "❌ Failed to generate keystore"
    exit 1
fi

