import { resetLocalAppData } from '@/services/dataManagement';
import { getFirebaseAuth } from '@/services/firebase/auth';
import { getFirebaseFirestore } from '@/services/firebase/firestore';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';

const FIRESTORE_BATCH_LIMIT = 450;

export class AccountDeletionRequiresRecentLoginError extends Error {
  constructor() {
    super('Firebase requires a recent sign-in before account deletion.');
    this.name = 'AccountDeletionRequiresRecentLoginError';
  }
}

export function isAccountDeletionRequiresRecentLoginError(
  error: unknown,
): error is AccountDeletionRequiresRecentLoginError {
  return (
    error instanceof AccountDeletionRequiresRecentLoginError ||
    (error instanceof Error && error.name === 'AccountDeletionRequiresRecentLoginError')
  );
}

function isFirebaseRecentLoginError(error: unknown): boolean {
  return (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: unknown }).code === 'auth/requires-recent-login'
  );
}

async function commitDeletes(db: Firestore, refs: DocumentReference[]): Promise<void> {
  for (let index = 0; index < refs.length; index += FIRESTORE_BATCH_LIMIT) {
    const batch = writeBatch(db);
    refs.slice(index, index + FIRESTORE_BATCH_LIMIT).forEach((ref) => {
      batch.delete(ref);
    });
    await batch.commit();
  }
}

async function deleteCollectionDocs(db: Firestore, path: string): Promise<void> {
  const snap = await getDocs(collection(db, path));
  await commitDeletes(db, snap.docs.map((entry) => entry.ref));
}

async function deleteHabitData(db: Firestore, uid: string): Promise<void> {
  const habitsPath = `users/${uid}/habits`;
  const habitsSnap = await getDocs(collection(db, habitsPath));
  const habitDocs = habitsSnap.docs;
  const completionRefs: DocumentReference[] = [];
  const COMPLETION_LIST_CONCURRENCY = 5;

  for (let index = 0; index < habitDocs.length; index += COMPLETION_LIST_CONCURRENCY) {
    const chunk = habitDocs.slice(index, index + COMPLETION_LIST_CONCURRENCY);
    const snaps = await Promise.all(
      chunk.map((habitDoc) => getDocs(collection(db, `${habitsPath}/${habitDoc.id}/completions`))),
    );
    for (const snap of snaps) {
      completionRefs.push(...snap.docs.map((entry) => entry.ref));
    }
  }

  await commitDeletes(db, completionRefs);
  await commitDeletes(db, habitDocs.map((entry) => entry.ref));
}

export async function deleteSignedInAccountAndData(): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  const db = getFirebaseFirestore();

  if (!user || user.isAnonymous) {
    throw new Error('A signed-in Firebase account is required before account deletion.');
  }

  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const uid = user.uid;

  await deleteHabitData(db, uid);
  await deleteCollectionDocs(db, `users/${uid}/goals`);
  await deleteCollectionDocs(db, `users/${uid}/activities`);

  try {
    await deleteDoc(doc(db, `users/${uid}`));
  } catch (error) {
    // Profile doc may already be missing; do not block Auth + local wipe.
    console.warn('Account deletion: profile document delete skipped or failed.', error);
  }

  try {
    await deleteUser(user);
  } catch (error) {
    if (isFirebaseRecentLoginError(error)) {
      throw new AccountDeletionRequiresRecentLoginError();
    }
    throw error;
  }
  await resetLocalAppData();
}
