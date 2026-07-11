// services/firebase/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearActivityLocalCache } from "@/repositories/local/activityRepository.local";
import { clearGoalLocalCache } from "@/repositories/local/goalRepository.local";
import { clearHabitLocalCache } from "@/repositories/local/habitRepository.local";
import { clearUserLocalSessionData } from "@/repositories/local/userRepository.local";
import { clearSyncQueue } from "@/services/sync/syncQueue";
import { storage } from "@/storage/asyncStorage";
import * as FirebaseAuth from "firebase/auth";
import { Auth, Persistence, User, UserCredential } from "firebase/auth";
import { Platform } from "react-native";
import { getFirebaseApp } from "./app";
import {
  AuthUpgradeRequiresChoiceError,
  getFirebaseErrorCode,
  isCredentialCollisionError,
  resolveAuthUpgradeStrategy,
} from "./authUpgradePolicy";

let authInstance: Auth | null = null;
let bootstrapPromise: Promise<User | null> | null = null;
let authUnavailable = false;
let hasLoggedAuthUnavailable = false;

type SessionCleanupStep = {
  name: string;
  run: () => Promise<void>;
};

function getSessionCleanupErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function throwIfCredentialCollision(error: unknown): never | void {
  if (isCredentialCollisionError(getFirebaseErrorCode(error))) {
    throw new AuthUpgradeRequiresChoiceError();
  }
}

async function clearSignedInUserSessionData(): Promise<void> {
  const cleanupSteps: SessionCleanupStep[] = [
    { name: "habit cache", run: clearHabitLocalCache },
    { name: "goal cache", run: clearGoalLocalCache },
    { name: "activity cache", run: clearActivityLocalCache },
    { name: "user session", run: clearUserLocalSessionData },
    {
      name: "cloud sync queue",
      run: () => clearSyncQueue(["user", "habits", "goals", "activities"]),
    },
    { name: "user email", run: () => storage.removeItem("kaarma_user_email") },
  ];

  const results = await Promise.allSettled(cleanupSteps.map((step) => step.run()));
  const failures = results.flatMap((result, index) => {
    if (result.status === "fulfilled") {
      return [];
    }

    return [
      `${cleanupSteps[index].name}: ${getSessionCleanupErrorMessage(result.reason)}`,
    ];
  });

  if (failures.length > 0) {
    console.warn(`Sign-out cleanup failed for ${failures.join("; ")}`);
    throw new Error(
      `Sign-out cleanup failed for ${failures.map((failure) => failure.split(":")[0]).join(", ")}.`,
    );
  }
}

function logAuthUnavailable(message: string, error?: unknown): void {
  if (hasLoggedAuthUnavailable) return;
  hasLoggedAuthUnavailable = true;
  console.warn(message, error);
}

export function getFirebaseAuth(): Auth | null {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();
  if (!app) return null;

  if (Platform.OS === "web") {
    authInstance = FirebaseAuth.getAuth(app);
    return authInstance;
  }

  try {
    const getReactNativePersistence = (
      FirebaseAuth as unknown as {
        getReactNativePersistence?: (
          storage: typeof AsyncStorage,
        ) => Persistence;
      }
    ).getReactNativePersistence;

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
        if (code === "auth/admin-restricted-operation") {
          authUnavailable = true;
          logAuthUnavailable(
            "[firebase] Anonymous auth is disabled for this Firebase project. Enable Anonymous provider in Firebase Console > Authentication > Sign-in method. Falling back to local-only mode.",
            error,
          );
          return null;
        }

        logAuthUnavailable(
          "[firebase] Anonymous auth failed. Falling back to local-only mode.",
          error,
        );
        return null;
      })
      .finally(() => {
        bootstrapPromise = null;
      });
  }

  return bootstrapPromise;
}

async function applyDisplayName(user: User, displayName?: string): Promise<void> {
  if (displayName?.trim()) {
    await FirebaseAuth.updateProfile(user, {
      displayName: displayName.trim(),
    });
  }
}

export async function continueWithExistingAccountSignIn(
  email: string,
  password: string,
): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase auth is not configured.");
  }

  const credential = await FirebaseAuth.signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  return credential.user;
}

/** After create-account collision choice: sign into the existing account (do not create again). */
export async function continueCreateAccountSignIn(
  email: string,
  password: string,
): Promise<User> {
  return continueWithExistingAccountSignIn(email, password);
}

export async function continueWithExistingGoogleAccount(idToken: string): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase auth is not configured.");
  }

  const credential = FirebaseAuth.GoogleAuthProvider.credential(idToken);
  const result = await FirebaseAuth.signInWithCredential(auth, credential);
  return result.user;
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase auth is not configured.");
  }

  const emailCredential = FirebaseAuth.EmailAuthProvider.credential(email, password);
  const strategy = resolveAuthUpgradeStrategy(auth.currentUser?.isAnonymous);

  if (strategy === "link" && auth.currentUser) {
    try {
      const linked = await FirebaseAuth.linkWithCredential(auth.currentUser, emailCredential);
      return linked.user;
    } catch (error) {
      throwIfCredentialCollision(error);
      throw error;
    }
  }

  const credential = await FirebaseAuth.signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  return credential.user;
}

export async function createAccountWithEmailPassword(
  email: string,
  password: string,
  displayName?: string,
): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase auth is not configured.");
  }

  const emailCredential = FirebaseAuth.EmailAuthProvider.credential(email, password);
  const strategy = resolveAuthUpgradeStrategy(auth.currentUser?.isAnonymous);

  if (strategy === "link" && auth.currentUser) {
    try {
      const linked = await FirebaseAuth.linkWithCredential(auth.currentUser, emailCredential);
      await applyDisplayName(linked.user, displayName);
      return linked.user;
    } catch (error) {
      throwIfCredentialCollision(error);
      throw error;
    }
  }

  try {
    const credential = await FirebaseAuth.createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    await applyDisplayName(credential.user, displayName);
    return credential.user;
  } catch (error) {
    throwIfCredentialCollision(error);
    throw error;
  }
}

export async function signOutCurrentUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) {
    await clearSignedInUserSessionData();
    return;
  }

  await FirebaseAuth.signOut(auth);
  await clearSignedInUserSessionData();
  await ensureAnonymousAuth();
}

export async function signInWithGoogleIdToken(idToken: string): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase auth is not configured.");
  }

  const credential = FirebaseAuth.GoogleAuthProvider.credential(idToken);
  const strategy = resolveAuthUpgradeStrategy(auth.currentUser?.isAnonymous);

  if (strategy === "link" && auth.currentUser) {
    try {
      const linked = await FirebaseAuth.linkWithCredential(auth.currentUser, credential);
      return linked.user;
    } catch (error) {
      throwIfCredentialCollision(error);
      throw error;
    }
  }

  const result = await FirebaseAuth.signInWithCredential(auth, credential);
  return result.user;
}

export function getCurrentUserEmail(): string | null {
  return getFirebaseAuth()?.currentUser?.email ?? null;
}

export function getCurrentUserId(): string | null {
  return getFirebaseAuth()?.currentUser?.uid ?? null;
}

export function subscribeToAuthState(
  listener: (user: User | null) => void,
): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    listener(null);
    return () => {};
  }

  return FirebaseAuth.onAuthStateChanged(auth, listener);
}

export { AuthUpgradeRequiresChoiceError };
