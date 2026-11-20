import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const FIREBASE_STORAGE_KEY = 'star_galaxy_firebase_config';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyB0ZL4r72-G6XCapKvjA-cbOWJbjC9dNuI",
  authDomain: "sni-org-in.firebaseapp.com",
  projectId: "sni-org-in",
  storageBucket: "sni-org-in.firebasestorage.app",
  messagingSenderId: "717850324141",
  appId: "1:717850324141:web:17280789950030ea386a24",
  measurementId: "G-L3XR047S9Q",
};

// Load stored config or environment variables, or fallback to default production config
export function getStoredFirebaseConfig() {
  try {
    const saved = localStorage.getItem(FIREBASE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate from old project if present
      if (parsed.projectId === 'star-galaxy-a3ef2') {
        localStorage.removeItem(FIREBASE_STORAGE_KEY);
        return DEFAULT_FIREBASE_CONFIG;
      }
      return parsed;
    }
  } catch (e) {}

  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }

  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config) {
  try {
    localStorage.setItem(FIREBASE_STORAGE_KEY, JSON.stringify(config));
    window.location.reload(); // Reload to initialize with new credentials
    return true;
  } catch (e) {
    console.error('Error saving firebase config:', e);
    return false;
  }
}

export function clearFirebaseConfig() {
  localStorage.removeItem(FIREBASE_STORAGE_KEY);
  window.location.reload();
}

let app = null;
let db = null;
let auth = null;
let analytics = null;

const config = getStoredFirebaseConfig();

if (config && config.apiKey && config.projectId) {
  try {
    app = getApps().length === 0 ? initializeApp(config) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    if (typeof window !== 'undefined') {
      isSupported().then(supported => {
        if (supported && config.measurementId) {
          analytics = getAnalytics(app);
        }
      }).catch(() => {});
    }
    console.log('✅ Firebase initialized successfully with project:', config.projectId);
  } catch (e) {
    console.error('❌ Failed to initialize Firebase:', e);
  }
}

export { app, db, auth, analytics };
export const isFirebaseConfigured = () => !!db;
