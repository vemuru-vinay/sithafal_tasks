# SchoolPass — Setup Guide

Complete step-by-step guide to get the app running on your phone in ~20 minutes.

---

## What You'll Need

- A computer (Mac, Windows, or Linux)
- Node.js installed → https://nodejs.org (download LTS version)
- A smartphone (Android or iPhone) with the **Expo Go** app installed
  - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
  - iPhone:  https://apps.apple.com/app/expo-go/id982107779
- A free Google account (for Firebase)

---

## Step 1 — Clone / Download the Project

If you received this as a ZIP file:
```bash
unzip SchoolPass.zip
cd SchoolPass
```

If using git:
```bash
git clone <your-repo-url>
cd SchoolPass
```

---

## Step 2 — Install Dependencies

Open a terminal in the `SchoolPass` folder and run:

```bash
npm install
```

Wait for it to finish (may take 2–3 minutes).

---

## Step 3 — Create Firebase Project

1. Go to **https://console.firebase.google.com**
2. Click **"Create a project"**
3. Name it `SchoolPass` → click Continue → disable Google Analytics → Create project

### 3a. Enable Authentication
1. In Firebase Console → **Authentication** → Get started
2. Click **Email/Password** → Enable → Save

### 3b. Enable Firestore
1. In Firebase Console → **Firestore Database** → Create database
2. Choose **"Start in test mode"** → Next → Select a region → Enable

### 3c. Get your Firebase config
1. In Firebase Console → **Project Settings** (gear icon) → General tab
2. Scroll down to **"Your apps"** → Click the **`</>`** (web) icon
3. Register app (name it `SchoolPass`) → copy the `firebaseConfig` object

---

## Step 4 — Add Firebase Config to the App

Open the file:
```
src/services/firebase.js
```

Replace the `firebaseConfig` block with your values:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← paste your values here
  authDomain: "schoolpass-xxx.firebaseapp.com",
  projectId: "schoolpass-xxx",
  storageBucket: "schoolpass-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

---

## Step 5 — Create Demo Users in Firebase

### Option A — Firebase Console (quick, manual)

Go to **Authentication** → **Users** → **Add user** and create 4 accounts:

| Email                          | Password   | Role     |
|-------------------------------|------------|----------|
| student@schoolpass.demo        | demo1234   | student  |
| parent@schoolpass.demo         | demo1234   | parent   |
| mentor@schoolpass.demo         | demo1234   | mentor   |
| gate@schoolpass.demo           | demo1234   | watchman |

Then go to **Firestore Database** → **Start collection** → Collection ID: `users`

Add one document per user with these fields (Document ID = user's UID from Auth):

**Student document:**
```json
{
  "uid":      "< student's UID from Auth >",
  "email":    "student@schoolpass.demo",
  "name":     "Arjun Kumar",
  "role":     "student",
  "class":    "X-B",
  "rollNo":   14,
  "parentId": "< parent's UID >",
  "mentorId": "< mentor's UID >",
  "fcmToken": null
}
```

**Parent document:**
```json
{
  "uid":   "< parent's UID >",
  "email": "parent@schoolpass.demo",
  "name":  "Rajesh Kumar",
  "role":  "parent",
  "fcmToken": null
}
```

**Mentor document:**
```json
{
  "uid":   "< mentor's UID >",
  "email": "mentor@schoolpass.demo",
  "name":  "Ms. Priya Sharma",
  "role":  "mentor",
  "class": "X-B",
  "fcmToken": null
}
```

**Watchman document:**
```json
{
  "uid":    "< watchman's UID >",
  "email":  "gate@schoolpass.demo",
  "name":   "R. Gupta",
  "role":   "watchman",
  "gateId": "GATE-01",
  "fcmToken": null
}
```

### Option B — Run the Setup Script (advanced)

If you have firebase-admin set up:
```bash
npm install firebase-admin
node scripts/setup-firebase.js
```

---

## Step 6 — Run the App

In your terminal:
```bash
npx expo start
```

A QR code will appear in the terminal. 

**On your phone:**
- Open the **Expo Go** app
- Scan the QR code
- The app will load on your phone!

---

## Step 7 — Test the Full Flow

Open the app on **4 different phones** (or 4 browser tabs using the web version), log in as each role and test:

### Demo Flow:
1. **Student** → logs in → taps "New Exit Request" → fills form → submits
2. **Parent** → gets a notification → taps → reviews → taps "Approve"
3. **Mentor** → gets an alert → taps → reviews → taps "Acknowledge & Release QR"
4. **Student** → sees QR code appear → taps it to open full-screen
5. **Gate** → scans QR with camera → sees green "CLEARED FOR EXIT" → taps "Confirm Exit"
6. **Parent + Mentor** → both get "Arjun has exited" push notification

---

## Push Notifications Setup (FCM)

For push notifications to work on physical devices:

1. In Firebase Console → **Project Settings** → **Cloud Messaging** tab
2. Note your **Server key** (for production Cloud Functions)
3. The app uses **Expo Push API** for development — this works automatically with Expo Go

> For production builds (not using Expo Go):
> - Follow: https://docs.expo.dev/push-notifications/push-notifications-setup/
> - Add your `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

---

## Deploy Firestore Security Rules

Once you're done testing:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init firestore` (select your project)
4. Deploy rules: `firebase deploy --only firestore:rules`

---

## Project Structure

```
SchoolPass/
├── App.js                          ← Entry point
├── app.json                        ← Expo config
├── package.json                    ← Dependencies
├── firestore.rules                 ← Security rules
├── scripts/
│   └── setup-firebase.js           ← Demo user creator
└── src/
    ├── screens/
    │   ├── auth/
    │   │   └── LoginScreen.js      ← Shared login
    │   ├── student/
    │   │   ├── StudentDashboard.js ← S-02: Home
    │   │   ├── StudentRequestScreen.js ← S-03: Form
    │   │   └── StudentQRScreen.js  ← S-05: QR code
    │   ├── parent/
    │   │   ├── ParentInbox.js      ← P-01: Inbox
    │   │   └── ParentRequestDetail.js ← P-02: Approve/Reject
    │   ├── mentor/
    │   │   ├── MentorInbox.js      ← M-01: Alerts
    │   │   └── MentorRequestDetail.js ← M-02: Acknowledge/Flag
    │   └── gate/
    │       ├── GateScanner.js      ← G-01: Camera scanner
    │       ├── GateVerifyScreen.js ← G-02: Approve/Deny
    │       └── GateManualSearch.js ← G-04: Manual search
    ├── components/
    │   └── index.js                ← Shared UI components
    ├── navigation/
    │   └── RootNavigator.js        ← Role-based routing
    ├── services/
    │   ├── firebase.js             ← Firebase config ⚠️ edit this
    │   ├── firestore.js            ← All DB operations
    │   ├── notifications.js        ← Push notification helpers
    │   └── AuthContext.js          ← Auth state (React context)
    └── theme/
        └── index.js                ← Colors, fonts, spacing
```

---

## Common Issues

| Problem | Fix |
|---------|-----|
| "Firebase config invalid" | Check `src/services/firebase.js` — paste correct values |
| "Permission denied" in Firestore | Make sure Firestore is in test mode, or deploy the rules |
| No push notifications | Must be on a **physical device**, not a simulator |
| Camera not working | Must be on a **physical device**; grant camera permission |
| "User profile not found" | The Firestore `users` document doesn't exist — re-run Step 5 |
| App stuck on loading | Check the terminal for errors; likely a Firebase config issue |

---

## Building for Production (APK / IPA)

When ready to share with the school:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure build
eas build:configure

# Build for Android (APK)
eas build --platform android --profile preview

# Build for iOS (requires Apple Developer account)
eas build --platform ios
```

---

## Need Help?

1. Check the Expo docs: https://docs.expo.dev
2. Check Firebase docs: https://firebase.google.com/docs
3. Common errors are listed in the table above
