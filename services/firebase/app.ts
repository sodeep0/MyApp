import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import {
  CustomProvider,
  initializeAppCheck,
  ReCaptchaV3Provider,
} from 'firebase/app-check';
import { Platform } from 'react-native';
import {
  isAppCheckEnabledByEnv,
  isAppCheckInitPathAvailable,
  resolveAppCheckInitPath,
  type AppCheckInitPath,
} from './appCheckPolicy';

export type { AppCheckInitPath };
export {
  isAppCheckEnabledByEnv,
  isAppCheckInitPathAvailable,
  resolveAppCheckInitPath,
};

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

function currentAppCheckPath(): AppCheckInitPath {
  return resolveAppCheckInitPath({
    enabled: isAppCheckEnabledByEnv(),
    platform: Platform.OS,
    siteKey: process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY,
    debugToken: process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN,
  });
}

function createDebugTokenProvider(debugToken: string): CustomProvider {
  return new CustomProvider({
    getToken: async () => ({
      token: debugToken,
      expireTimeMillis: Date.now() + 60 * 60 * 1000,
    }),
  });
}

function maybeInitializeAppCheck(app: FirebaseApp): void {
  if (hasInitializedAppCheck) return;
  if (!isAppCheckEnabledByEnv()) return;

  const path = currentAppCheckPath();

  try {
    if (path === 'recaptcha-v3') {
      const siteKey = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY!;
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
      hasInitializedAppCheck = true;
      return;
    }

    if (path === 'custom-debug-token') {
      const debugToken = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN!;
      // Native Play Integrity / DeviceCheck ideally use @react-native-firebase/app-check.
      // When that package is not installed, CustomProvider + debug token supports local/dev.
      initializeAppCheck(app, {
        provider: createDebugTokenProvider(debugToken),
        isTokenAutoRefreshEnabled: true,
      });
      hasInitializedAppCheck = true;
      return;
    }

    // custom-warn-only (web without site key, or native without debug token)
    console.warn(
      '[firebase] App Check flag enabled but no provider credentials are configured. '
        + 'Web needs EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY; native needs '
        + 'EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN (dev) or @react-native-firebase/app-check. '
        + 'Marking App Check as initialized without tokens — enable enforcement in Firebase Console only after providers work.',
    );
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
