import { Firestore, connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { getFirebaseApp } from './app';

let firestoreInstance: Firestore | null = null;
let emulatorConnected = false;

function shouldUseEmulator(): boolean {
  return process.env.EXPO_PUBLIC_USE_FIRESTORE_EMULATOR === 'true';
}

export function getFirebaseFirestore(): Firestore | null {
  if (firestoreInstance) return firestoreInstance;

  const app = getFirebaseApp();
  if (!app) return null;

  firestoreInstance = getFirestore(app);

  if (shouldUseEmulator() && !emulatorConnected) {
    connectFirestoreEmulator(firestoreInstance, '127.0.0.1', 8081);
    emulatorConnected = true;
  }

  return firestoreInstance;
}
