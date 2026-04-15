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
import type { ActivityRepository } from '@/repositories/interfaces/activityRepository';
import { activityLocalRepository } from '@/repositories/local/activityRepository.local';
import { enqueueSyncItem, flushSyncQueue } from '@/services/sync/syncQueue';
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

export async function flushActivityQueue(): Promise<void> {
  await flushSyncQueue('activities', async (item) => {
    const context = await getCloudContext();
    if (!context) throw new Error('cloud context unavailable');

    if (item.action === 'setActivity') {
      await setActivityInCloud(context.uid, context.db, item.payload as ActivityLog);
      return;
    }

    if (item.action === 'deleteActivity') {
      await deleteActivityInCloud(context.uid, context.db, item.payload as string);
    }
  });
}

export const activityFirebaseRepository: ActivityRepository = {
  async getAllActivities() {
    const context = await getCloudContext();
    if (!context) return activityLocalRepository.getAllActivities();

    await flushActivityQueue();
    const q = query(collection(context.db, activitiesPath(context.uid)), orderBy('loggedAt', 'desc'));
    const snap = await getDocs(q);
    const entries = snap.docs.map((d) => d.data() as ActivityLog);
    await activityLocalRepository.saveActivities(entries);
    return entries;
  },

  async getActivityById(id) {
    const entries = await this.getAllActivities();
    return entries.find((e) => e.id === id);
  },

  async saveActivities(entries) {
    await activityLocalRepository.saveActivities(entries);
    const context = await getCloudContext();
    if (!context) {
      for (const entry of entries) {
        await enqueueSyncItem('activities', 'setActivity', entry);
      }
      return;
    }

    for (const entry of entries) {
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
    await activityLocalRepository.deleteActivity(id);
    const context = await getCloudContext();
    if (!context) {
      await enqueueSyncItem('activities', 'deleteActivity', id);
      return;
    }

    try {
      await deleteActivityInCloud(context.uid, context.db, id);
      await flushActivityQueue();
    } catch {
      await enqueueSyncItem('activities', 'deleteActivity', id);
    }
  },

  async getWeeklySummary() {
    return activityLocalRepository.getWeeklySummary();
  },

  async getFrequentActivityNames(limit = 3) {
    return activityLocalRepository.getFrequentActivityNames(limit);
  },
};
