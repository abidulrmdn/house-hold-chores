# Getting Started

Welcome to the Household Routine Manager! This guide will help you set up and run the application.

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Firebase account** (free tier works)
- **Git** (for cloning the repository)

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd household-routine-manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Firebase** (see [Firebase Setup Guide](./firebase-setup.md))

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:5173`

## What's Next?

- **[Firebase Setup](./firebase-setup.md)** - Configure Firebase services
- **[Deployment Guide](../deployment/README.md)** - Deploy to production
- **[Android App Setup](../android/README.md)** - Build native Android app
- **[Troubleshooting](../troubleshooting/README.md)** - Common issues and solutions

## Project Structure

```
household-routine-manager/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── store/           # Zustand state management
│   ├── firebase/        # Firebase configuration
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── public/              # Static assets
├── android/             # Android app (Capacitor)
├── functions/           # Firebase Cloud Functions
└── docs/                # Documentation
```

## Features

- ✅ **Routine Management**: Create periodic tasks (daily, weekly, bi-weekly, monthly)
- 📁 **Categories**: Organize routines by categories
- 👥 **Multi-user Support**: Assign tasks to different household members
- 📱 **Swipe to Complete**: Easy swipe gesture to mark tasks as done
- 🔔 **Push Notifications**: Get notified about due tasks
- 📊 **Streak Tracking**: See how many times you've missed a task
- 📅 **Smart Views**: Filter by today, this week, or all tasks
- 🎨 **Beautiful UI**: Modern, responsive design with Tailwind CSS
- 📱 **PWA**: Install as an app on your device
- 🤖 **Android App**: Native Android app available

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Backend**: Firebase (Auth, Firestore, Cloud Messaging, Hosting)
- **Mobile**: Capacitor (Android/iOS support)

For more details, see [Tech Stack](../features/tech-stack.md).

## Need Help?

- Check the [Troubleshooting Guide](../troubleshooting/README.md)
- Review [Common Issues](../troubleshooting/common-issues.md)
- See [Firebase Setup](./firebase-setup.md) for configuration help

