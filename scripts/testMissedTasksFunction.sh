#!/bin/bash

# Script to test the checkMissedTasks Cloud Function
# This will trigger the function manually so you can see the results immediately

echo "🚀 Testing checkMissedTasks Cloud Function..."
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

echo "📋 Steps to test:"
echo ""
echo "1. First, create the test routine (if not already done):"
echo "   npx ts-node scripts/createTestOverdueRoutine.ts"
echo ""
echo "2. Deploy the function (if not already deployed):"
echo "   cd functions && npm run build && cd .."
echo "   firebase deploy --only functions:checkMissedTasks"
echo ""
echo "3. Trigger the function manually:"
echo "   firebase functions:shell"
echo ""
echo "   Then in the shell, run:"
echo "   checkMissedTasks()"
echo ""
echo "4. Check the logs:"
echo "   firebase functions:log --only checkMissedTasks --limit 20"
echo ""
echo "5. Check Firestore to see if:"
echo "   - The overdue task was marked as completed"
echo "   - A new task for today was created"
echo "   - The missed count was incremented"
echo ""

# Optionally, try to trigger it directly if firebase-tools supports it
echo "💡 Tip: You can also use the Firebase Console to trigger the function:"
echo "   https://console.firebase.google.com/project/YOUR_PROJECT/functions"
echo ""

