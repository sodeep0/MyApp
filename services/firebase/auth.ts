import AsyncStorage from '@react-native-async-storage/async-storage';
import { Auth, Persistence, User, UserCredential } from 'firebase/auth';
import * as FirebaseAuth from 'firebase/auth';
import { Platform } from 'react-native';
import { getFirebaseApp } from './app';

let authInstance: Auth | null = null;
let bootstrapPromise: Promise<User | null> | null = null;
let authUnavailable = false;
let hasLoggedAuthUnavailable = false;

function logAuthUnavailable(message: string, error?: unknown): void {
  if (hasLoggedAuthUnavailable) return;
  hasLoggedAuthUnavailable = true;
  console.warn(message, error);
}

export function getFirebaseAuth(): Auth | null {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();
  if (!app) return null;

  if (Platform.OS === 'web') {
    authInstance = FirebaseAuth.getAuth(app);
    return authInstance;
  }

  try {
    const getReactNativePersistence = (FirebaseAuth as unknown as {
      getReactNativePersistence?: (storage: typeof AsyncStorage) => Persistence;
    }).getReactNativePersistence;

    if (getReactNativePersistence) {
      authInstance = FirebaseAuth.initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } else {
      authInstance = FirebaseAuth.getAuth(app);
    }
  } catch {
    authInstance = FirebaseAuth.getAuth(app);
  }

  return authInstance;
}

export async function ensureAnonymousAuth(): Promise<User | null> {
  if (authUnavailable) return null;

  const auth = getFirebaseAuth();
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;

  if (!bootstrapPromise) {
    bootstrapPromise = FirebaseAuth.signInAnonymously(auth)
      .then((cred: UserCredential) => cred.user)
      .catch((error: unknown) => {
        const code = (error as { code?: string })?.code;
        if (code === 'auth/admin-restricted-operation') {
          authUnavailable = true;
          logAuthUnavailable(
            '[firebase] Anonymous auth is disabled for this Firebase project. Enable Anonymous provider in Firebase Console > Authentication > Sign-in method. Falling back to local-only mode.',
            error,
          );
          return null;
        }

        logAuthUnavailable('[firebase] Anonymous auth failed. Falling back to local-only mode.', error);
        return null;
      })
      .finally(() => {
        bootstrapPromise = null;
      });
  }

  return bootstrapPromise;
}

export function getCurrentUserId(): string | null {
  return getFirebaseAuth()?.currentUser?.uid ?? null;
}
