#!/bin/bash

# Quick script to clear rate limits for a specific user or all users
# Usage: ./scripts/clearRateLimit.sh [userId]

echo "⚠️  WARNING: This will clear rate limit data!"
echo ""

if [ -z "$1" ]; then
  echo "Usage: $0 [userId]"
  echo "Example: $0 abc123xyz"
  echo ""
  echo "To clear all rate limits, use Firebase Console:"
  echo "1. Go to Firestore Database"
  echo "2. Find 'rateLimits' collection"
  echo "3. Delete documents"
  exit 1
fi

USER_ID=$1
RATE_LIMIT_KEY="suggestions:${USER_ID}"

echo "Clearing rate limit for user: ${USER_ID}"
echo "Rate limit key: ${RATE_LIMIT_KEY}"
echo ""

# Use Firebase CLI to delete the document
firebase firestore:delete "rateLimits/${RATE_LIMIT_KEY}" --yes

if [ $? -eq 0 ]; then
  echo "✅ Successfully cleared rate limit for user ${USER_ID}"
else
  echo "❌ Error clearing rate limit"
  exit 1
fi

