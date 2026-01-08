#!/bin/bash

# Quick script to create a test overdue routine using Firebase CLI
# This uses Firebase CLI instead of Admin SDK, so no serviceAccountKey.json needed

echo "🚀 Creating test overdue routine..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Run: firebase login"
    exit 1
fi

USER_ID="kk1Pl9DSnjS5aA954MqMeOKVW9W2"

echo "📝 This script will create:"
echo "   - A test routine: 'Test Daily Routine (Overdue)'"
echo "   - An overdue task (due yesterday)"
echo "   - Assigned to user: $USER_ID"
echo ""
echo "⚠️  Note: This requires Firebase Admin SDK access."
echo "   For a simpler approach, use the Firebase Console to manually create:"
echo ""
echo "   1. Create routine: 'Test Daily Routine (Overdue)'"
echo "      - Frequency: daily"
echo "      - Assign to: $USER_ID"
echo ""
echo "   2. Create task instance:"
echo "      - routineId: (the routine you just created)"
echo "      - dueDate: yesterday's timestamp"
echo "      - assignedTo: $USER_ID"
echo "      - isCompleted: false"
echo ""
echo "   Or use the Node.js script: node scripts/createTestOverdueRoutine.js"
echo ""

