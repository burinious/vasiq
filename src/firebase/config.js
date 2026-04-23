import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredFirebaseFields = [
  'apiKey',
  'authDomain',
  'projectId',
  'messagingSenderId',
  'appId',
];

const isUnsetValue = (value) =>
  !value || value.startsWith('your_') || value.includes('your_project');

export const firebaseConfigIssues = requiredFirebaseFields
  .filter((field) => isUnsetValue(firebaseConfig[field]))
  .map((field) => `VITE_FIREBASE_${field.replace(/[A-Z]/g, (char) => `_${char}`).toUpperCase()}`);

export const firebaseReady = firebaseConfigIssues.length === 0;

const app = firebaseReady ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;

if (auth && typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Unable to enable local auth persistence.', error);
  });
}

let db = null;

if (app) {
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (error) {
    console.error('Unable to enable persistent Firestore cache. Falling back.', error);
    db = getFirestore(app);
  }
}

export { db };
