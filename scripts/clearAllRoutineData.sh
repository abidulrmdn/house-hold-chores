#!/bin/bash

# Quick script to delete all routine-related data using Firebase CLI
# Usage: ./scripts/clearAllRoutineData.sh

echo "⚠️  WARNING: This will delete ALL routine-related data!"
echo "This includes:"
echo "  - All task instances"
echo "  - All routines"
echo "  - Optionally: All categories"
echo ""
read -p "Type 'DELETE ALL' to confirm: " confirm

if [ "$confirm" != "DELETE ALL" ]; then
  echo "Operation cancelled."
  exit 0
fi

read -p "Delete categories too? (yes/no, default: no): " delete_categories

echo ""
echo "Deleting task instances..."
firebase firestore:delete --recursive --yes taskInstances

echo "Deleting routines..."
firebase firestore:delete --recursive --yes routines

if [ "$delete_categories" = "yes" ]; then
  echo "Deleting categories..."
  firebase firestore:delete --recursive --yes categories
fi

echo ""
echo "✅ All done! Your Firestore is now clean."
echo "Note: Households and Users are preserved."
