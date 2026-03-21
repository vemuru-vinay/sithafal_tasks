// scripts/setup-firebase.js
// Run this ONCE to create demo users in Firebase
// Usage: node scripts/setup-firebase.js
//
// Prerequisites:
//   npm install firebase-admin
//   Set GOOGLE_APPLICATION_CREDENTIALS env variable to your service account JSON
//   OR paste your serviceAccount JSON directly below

const admin = require('firebase-admin');

// ── Option A: Use service account file ────────────────
// const serviceAccount = require('./serviceAccountKey.json');
// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// ── Option B: Use env variable (recommended) ──────────
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  // projectId: 'YOUR_PROJECT_ID',  // uncomment if needed
});

const auth = admin.auth();
const db   = admin.firestore();

const DEMO_USERS = [
  {
    email: 'student@schoolpass.demo',
    password: 'demo1234',
    profile: {
      name:      'Arjun Kumar',
      role:      'student',
      class:     'X-B',
      rollNo:    14,
      // These IDs will be filled after all users are created:
      parentId:  '', // will be updated
      mentorId:  '', // will be updated
    },
  },
  {
    email: 'parent@schoolpass.demo',
    password: 'demo1234',
    profile: {
      name: 'Rajesh Kumar',
      role: 'parent',
    },
  },
  {
    email: 'mentor@schoolpass.demo',
    password: 'demo1234',
    profile: {
      name:  'Ms. Priya Sharma',
      role:  'mentor',
      class: 'X-B',
    },
  },
  {
    email: 'gate@schoolpass.demo',
    password: 'demo1234',
    profile: {
      name:   'R. Gupta',
      role:   'watchman',
      gateId: 'GATE-01',
    },
  },
];

async function setup() {
  console.log('Creating demo users...\n');
  const uids = {};

  for (const u of DEMO_USERS) {
    try {
      // Create Firebase Auth user
      const userRecord = await auth.createUser({
        email:    u.email,
        password: u.password,
        displayName: u.profile.name,
      });
      uids[u.profile.role] = userRecord.uid;

      // Create Firestore profile
      await db.collection('users').doc(userRecord.uid).set({
        ...u.profile,
        uid:       userRecord.uid,
        email:     u.email,
        fcmToken:  null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✓ Created ${u.profile.role}: ${u.email} (uid: ${userRecord.uid})`);
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        const existing = await auth.getUserByEmail(u.email);
        uids[u.profile.role] = existing.uid;
        console.log(`  Already exists: ${u.email} (uid: ${existing.uid})`);
      } else {
        console.error(`✗ Failed for ${u.email}:`, err.message);
      }
    }
  }

  // Update student profile with parentId + mentorId
  if (uids.student && uids.parent && uids.mentor) {
    await db.collection('users').doc(uids.student).update({
      parentId: uids.parent,
      mentorId: uids.mentor,
    });
    console.log('\n✓ Linked student → parent + mentor');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Demo account UIDs:');
  Object.entries(uids).forEach(([role, uid]) => {
    console.log(`  ${role.padEnd(10)}: ${uid}`);
  });
  console.log('\nAll demo accounts ready. Password: demo1234');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
