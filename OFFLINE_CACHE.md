# Offline Cache Behavior

## What is Cached

The PWA (Progressive Web App) caches the following for offline use:

### ✅ Cached (Available Offline)
- **Static Assets**: JavaScript, CSS, HTML files
- **Images**: Profile pictures, task photos, icons
- **Fonts**: Google Fonts and other web fonts
- **App Shell**: The basic UI structure

### ❌ NOT Cached (Requires Internet)
- **Firestore Data**: Tasks, routines, categories, user data
- **Real-time Updates**: Changes from other household members
- **New Data**: Creating/updating tasks requires internet

## How It Works

1. **First Visit**: App downloads and caches all static files
2. **Subsequent Visits**: App loads instantly from cache
3. **Data Sync**: When online, Firestore syncs all data in real-time
4. **Offline Mode**: 
   - App UI loads from cache
   - You can view previously loaded data
   - You CANNOT create/update tasks without internet
   - Changes queue up and sync when connection is restored

## Firestore Offline Persistence

Firebase Firestore has built-in offline persistence, but it needs to be enabled:

### Current Status
- **Static assets**: ✅ Cached (works offline)
- **Firestore data**: ⚠️ Partially cached (last synced data available, but no writes)

### To Enable Full Offline Support

Firestore can cache data locally, but this requires additional configuration. Currently:
- Data is cached in memory during the session
- When you close the app, cached data is cleared
- On next open, data is fetched fresh from Firestore

### Benefits of Current Setup
- ✅ Fast loading (static assets cached)
- ✅ Works offline for viewing (if data was loaded before)
- ✅ Real-time sync when online
- ✅ No stale data issues

### Limitations
- ❌ Cannot create/update tasks offline
- ❌ Cannot see new data from other users offline
- ❌ Data resets when app is closed

## Summary

**Offline Cache**: ✅ Enabled for static assets (app works offline for viewing)
**Firestore Data**: ⚠️ Cached in memory only (requires internet for writes)

The app will work offline for viewing previously loaded data, but you need internet to:
- Create new routines
- Complete tasks
- See updates from other household members
- Upload photos

