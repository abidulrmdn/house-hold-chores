#!/bin/bash
# Wrapper script for deleteUser.ts

# Check if user identifier is provided
if [ -z "$1" ]; then
  echo "Usage: ./scripts/deleteUser.sh <user-email-or-uid> [--delete-firestore]"
  echo ""
  echo "Examples:"
  echo "  ./scripts/deleteUser.sh user@example.com"
  echo "  ./scripts/deleteUser.sh abc123xyz --delete-firestore"
  exit 1
fi

# Run the TypeScript script with tsx (handles ESM better)
npx tsx scripts/deleteUser.ts "$@"

