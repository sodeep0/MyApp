import { DocumentData, Firestore } from 'firebase/firestore';
import { getCurrentUserId, ensureAnonymousAuth } from '@/services/firebase/auth';
import { getFirebaseFirestore } from '@/services/firebase/firestore';

export async function getCloudContext(): Promise<{ uid: string; db: Firestore } | null> {
  await ensureAnonymousAuth();
  const uid = getCurrentUserId();
  const db = getFirebaseFirestore();
  if (!uid || !db) return null;
  return { uid, db };
}

export function toIsoString(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const maybeTimestamp = value as { toDate: () => Date };
    return maybeTimestamp.toDate().toISOString();
  }
  return new Date().toISOString();
}

export function withUpdatedAt<T extends Record<string, unknown>>(data: T): T & { updatedAt: string } {
  return {
    ...data,
    updatedAt: new Date().toISOString(),
  };
}

export function stripUndefined<T extends Record<string, unknown>>(obj: T): DocumentData {
  const out: Record<string, unknown> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined) out[k] = v;
  });
  return out;
}
