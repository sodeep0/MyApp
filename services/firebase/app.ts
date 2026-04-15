import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';

let hasWarnedMissingConfig = false;

function getFirebaseConfig(): FirebaseOptions {
  return {
    apiKey: process.env.EXPO_PUBLIC_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_MEASUREMENT_ID,
  };
}

export function isFirebaseConfigured(): boolean {
  const config = getFirebaseConfig();
  return Boolean(config.apiKey && config.projectId && config.appId);
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    if (!hasWarnedMissingConfig) {
      hasWarnedMissingConfig = true;
      console.warn('[firebase] Missing EXPO_PUBLIC_* config. Running in local-only mode.');
    }
    return null;
  }

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(getFirebaseConfig());
}
