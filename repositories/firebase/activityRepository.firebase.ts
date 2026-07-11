import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import type { ActivityLog } from '@/types/models';
import { normalizeActivities } from '@/repositories/activityNormalization';
import type { ActivityRepository } from '@/repositories/interfaces/activityRepository';
import { activityLocalRepository } from '@/repositories/local/activityRepository.local';
import { enqueueSyncItem, flushSyncQueue, PermanentSyncItemError } from '@/services/sync/syncQueue';
import { getCloudContext, stripUndefined } from './common';

function activitiesPath(uid: string): string {
  return `users/${uid}/activities`;
}

async function setActivityInCloud(uid: string, db: Firestore, activity: ActivityLog): Promise<void> {
  const ref = doc(db, `${activitiesPath(uid)}/${activity.id}`);
  await setDoc(ref, stripUndefined({ ...activity, userId: uid, updatedAt: new Date().toISOString() }), {
    merge: true,
  });
}

async function deleteActivityInCloud(uid: string, db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, `${activitiesPath(uid)}/${id}`));
}

function requireQueuedActivity(payload: unknown): ActivityLog {
  const [activity] = normalizeActivities([payload]);
  if (!activity) {
    throw new PermanentSyncItemError('queued activity payload is invalid');
  }
  return activity;
}

function requireQueuedId(payload: unknown, label: string): string {
  if (typeof payload !== 'string' || payload.trim().length === 0) {
    throw new PermanentSyncItemError(`queued ${label} id is invalid`);
  }
  return payload.trim();
}

function requireRepositoryId(id: string, label: string): string {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new Error(`${label} id must be a non-empty string.`);
  }
  return id.trim();
}

export async function flushActivityQueue(): Promise<void> {
  await flushSyncQueue('activities', async (item) => {
    const context = await getCloudContext();
    if (!context) throw new Error('cloud context unavailable');

    if (item.action === 'setActivity') {
      await setActivityInCloud(context.uid, context.db, requireQueuedActivity(item.payload));
      return;
    }

    if (item.action === 'deleteActivity') {
      await deleteActivityInCloud(context.uid, context.db, requireQueuedId(item.payload, 'activity'));
      return;
    }

    throw new PermanentSyncItemError(`unsupported activities sync action "${item.action}"`);
  });
}

let isRefreshingActivities = false;

function runInBackground(task: () => Promise<void>): void {
  void task().catch((error) => {
    console.warn('Activities background sync task failed.', error);
  });
}

function refreshActivitiesFromCloudInBackground(): void {
  if (isRefreshingActivities) return;
  isRefreshingActivities = true;

  runInBackground(async () => {
    try {
      const context = await getCloudContext();
      if (!context) return;

      await flushActivityQueue();
      const q = query(collection(context.db, activitiesPath(context.uid)), orderBy('loggedAt', 'desc'));
      const snap = await getDocs(q);
      const entries = normalizeActivities(snap.docs.map((d) => d.data()));
      await activityLocalRepository.saveActivities(entries);
    } catch (error) {
      console.warn('Activities cloud refresh failed; keeping local cache.', error);
    } finally {
      isRefreshingActivities = false;
    }
  });
}

export const activityFirebaseRepository: ActivityRepository = {
  async getAllActivities() {
    const localEntries = await activityLocalRepository.getAllActivities();
    refreshActivitiesFromCloudInBackground();
    return localEntries;
  },

  async getActivityById(id) {
    const entries = await this.getAllActivities();
    return entries.find((e) => e.id === id);
  },

  async saveActivities(entries) {
    const normalizedEntries = normalizeActivities(entries);
    await activityLocalRepository.saveActivities(normalizedEntries);
    const context = await getCloudContext();
    if (!context) {
      for (const entry of normalizedEntries) {
        await enqueueSyncItem('activities', 'setActivity', entry);
      }
      return;
    }

    for (const entry of normalizedEntries) {
      try {
        await setActivityInCloud(context.uid, context.db, entry);
      } catch {
        await enqueueSyncItem('activities', 'setActivity', entry);
      }
    }
    await flushActivityQueue();
  },

  async addActivity(data) {
    const entry = await activityLocalRepository.addActivity(data);
    const context = await getCloudContext();
    if (!context) {
      await enqueueSyncItem('activities', 'setActivity', entry);
      return entry;
    }

    try {
      await setActivityInCloud(context.uid, context.db, entry);
      await flushActivityQueue();
    } catch {
      await enqueueSyncItem('activities', 'setActivity', entry);
    }
    return entry;
  },

  async updateActivity(id, updates) {
    const updated = await activityLocalRepository.updateActivity(id, updates);
    if (!updated) return null;
    const context = await getCloudContext();
    if (!context) {
      await enqueueSyncItem('activities', 'setActivity', updated);
      return updated;
    }

    try {
      await setActivityInCloud(context.uid, context.db, updated);
      await flushActivityQueue();
    } catch {
      await enqueueSyncItem('activities', 'setActivity', updated);
    }
    return updated;
  },

  async deleteActivity(id) {
    const normalizedId = requireRepositoryId(id, 'Activity');
    await activityLocalRepository.deleteActivity(normalizedId);
    const context = await getCloudContext();
    if (!context) {
      await enqueueSyncItem('activities', 'deleteActivity', normalizedId);
      return;
    }

    try {
      await deleteActivityInCloud(context.uid, context.db, normalizedId);
      await flushActivityQueue();
    } catch {
      await enqueueSyncItem('activities', 'deleteActivity', normalizedId);
    }
  },

  async getWeeklySummary() {
    return activityLocalRepository.getWeeklySummary();
  },

  async getFrequentActivityNames(limit = 3) {
    return activityLocalRepository.getFrequentActivityNames(limit);
  },
};
