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
import { captureMessage } from '@/services/observability';
import { getCloudContext, stripUndefined, toIsoString } from './common';
import { createRefreshGuard, requireQueuedId } from './commonSync';
import { mergeByUpdatedAt } from './mergeByUpdatedAt';

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

const activitiesRefreshGuard = createRefreshGuard(
  'Activities cloud refresh failed; keeping local cache.',
);

function refreshActivitiesFromCloudInBackground(): void {
  activitiesRefreshGuard.run(async () => {
    const context = await getCloudContext();
    if (!context) return;

    await flushActivityQueue();
    const q = query(collection(context.db, activitiesPath(context.uid)), orderBy('loggedAt', 'desc'));
    const snap = await getDocs(q);
    const remoteEntries = normalizeActivities(
      snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          ...data,
          loggedAt: typeof data.loggedAt === 'string' ? data.loggedAt : toIsoString(data.loggedAt),
          createdAt: data.createdAt != null ? toIsoString(data.createdAt) : undefined,
          updatedAt: data.updatedAt != null
            ? toIsoString(data.updatedAt)
            : (typeof data.loggedAt === 'string' ? data.loggedAt : toIsoString(data.loggedAt)),
        };
      }),
    ) as Array<ActivityLog & { updatedAt?: string | null }>;
    const localEntries = (await activityLocalRepository.getAllActivities()) as Array<
      ActivityLog & { updatedAt?: string | null }
    >;
    const mergedEntries = mergeByUpdatedAt(localEntries, remoteEntries);
    await activityLocalRepository.saveActivities(mergedEntries);
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
      } catch (error) {
        captureMessage('activities cloud write failed; enqueueing', 'warning', {
          action: 'setActivity',
          error: String(error),
        });
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
    } catch (error) {
      captureMessage('activities cloud write failed; enqueueing', 'warning', {
        action: 'setActivity',
        error: String(error),
      });
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
    } catch (error) {
      captureMessage('activities cloud write failed; enqueueing', 'warning', {
        action: 'setActivity',
        error: String(error),
      });
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
    } catch (error) {
      captureMessage('activities cloud write failed; enqueueing', 'warning', {
        action: 'deleteActivity',
        error: String(error),
      });
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
