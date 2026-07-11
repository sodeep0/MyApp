import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { Platform } from 'react-native';

let hasWarnedMissingConfig = false;
let hasInitializedAppCheck = false;

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

function maybeInitializeAppCheck(app: FirebaseApp): void {
  if (hasInitializedAppCheck) return;
  if (process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK !== 'true') return;

  // Web can use reCAPTCHA v3 when a site key is configured. Native Play Integrity /
  // DeviceCheck providers require additional native setup — enable in console first.
  const siteKey = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY;
  if (Platform.OS !== 'web' || !siteKey) {
    console.warn(
      '[firebase] App Check flag enabled but provider is not configured for this platform. Skipping init.',
    );
    hasInitializedAppCheck = true;
    return;
  }

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
    hasInitializedAppCheck = true;
  } catch (error) {
    console.warn('[firebase] App Check initialization failed.', error);
    hasInitializedAppCheck = true;
  }
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    if (!hasWarnedMissingConfig) {
      hasWarnedMissingConfig = true;
      console.warn('[firebase] Missing EXPO_PUBLIC_* config. Running in local-only mode.');
    }
    return null;
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
  maybeInitializeAppCheck(app);
  return app;
}
