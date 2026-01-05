#!/bin/bash

# Quick script to delete all task instances using Firebase CLI
# Usage: ./scripts/clearTaskInstances.sh

echo "⚠️  WARNING: This will delete ALL task instances!"
echo "This action cannot be undone."
echo ""
read -p "Type 'DELETE ALL' to confirm: " confirm

if [ "$confirm" != "DELETE ALL" ]; then
  echo "Operation cancelled."
  exit 0
fi

echo ""
echo "Deleting all task instances..."
firebase firestore:delete --recursive taskInstances

if [ $? -eq 0 ]; then
  echo "✅ Successfully deleted all task instances!"
else
  echo "❌ Error deleting task instances"
  exit 1
fi
