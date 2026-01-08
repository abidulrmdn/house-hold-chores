# Tech Stack & Architecture

## Technology Choices

### Frontend Framework: React + TypeScript

- **React 18**: Modern, performant, great ecosystem
- **TypeScript**: Type safety, better developer experience, fewer bugs
- **Vite**: Lightning-fast build tool, excellent DX

### State Management: Zustand

- Lightweight (1KB)
- Simple API, no boilerplate
- Perfect for this app's state needs
- Better than Redux for small-medium apps

### Styling: Tailwind CSS

- Utility-first, rapid development
- Responsive by default
- Small bundle size with purging
- Modern, beautiful designs out of the box

### Animations: Framer Motion

- Best-in-class animation library for React
- Perfect for swipe gestures
- Smooth, performant animations
- Great developer experience

### Backend: Firebase

- **Free tier** is generous for this use case
- **Authentication**: Built-in Google + Email auth
- **Firestore**: Real-time database, perfect for collaborative apps
- **Cloud Messaging**: Push notifications
- **Hosting**: Free SSL, CDN, easy deployment

### PWA: Vite PWA Plugin

- Automatic service worker generation
- Offline support
- Installable as app
- Push notification support

### Mobile: Capacitor

- Convert PWA to native Android/iOS apps
- Access to native device features
- Single codebase for web and mobile

## Architecture Patterns

### Store Pattern (Zustand)

Separate stores for different domains:
- `useAuthStore`: User authentication
- `useHouseholdStore`: Household management
- `useRoutineStore`: Routines and tasks

### Component Structure

- **Pages**: Top-level route components (Dashboard, Auth)
- **Components**: Reusable UI components
- **Store**: State management
- **Types**: TypeScript definitions

### Data Flow

1. User action → Component
2. Component → Store action
3. Store → Firebase
4. Firebase → Store (via real-time listeners)
5. Store → Component (re-render)

## Key Features Implementation

### Swipe to Complete

- Uses Framer Motion's drag API
- Threshold-based completion
- Visual feedback during swipe

### Streak Tracking

- `missedCount` field on TaskInstance
- When task reaches next iteration without completion:
  - Previous task marked as done
  - New task created with incremented `missedCount`
- Prevents clutter of multiple overdue tasks

### Real-time Updates

- Firestore `onSnapshot` listeners
- Automatic UI updates when data changes
- Works across multiple devices/users

### Push Notifications

- Firebase Cloud Messaging
- Service worker handles background messages
- Foreground messages handled in app

## Performance Optimizations

1. **Code Splitting**: Vite automatically splits code
2. **Tree Shaking**: Unused code removed
3. **Lazy Loading**: Components loaded on demand
4. **Firestore Indexes**: Optimized queries
5. **Memoization**: React.memo for expensive components

## Security

- Firestore security rules protect data
- Authentication required for all operations
- Users can only access their household data
- Input validation on client and server (via rules)

## Scalability

- Firestore scales automatically
- No server management needed
- Can handle thousands of users
- Free tier sufficient for small-medium households

## Future Enhancements

- **Offline-first**: Better offline support with IndexedDB
- **Caching**: Cache frequently accessed data
- **Optimistic Updates**: Update UI before server confirms
- **Batch Operations**: Batch Firestore writes for efficiency

