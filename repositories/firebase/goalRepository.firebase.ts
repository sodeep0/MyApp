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
import type { Goal } from '@/types/models';
import { normalizeGoals } from '@/repositories/goalNormalization';
import type { GoalRepository } from '@/repositories/interfaces/goalRepository';
import { goalLocalRepository } from '@/repositories/local/goalRepository.local';
import { enqueueSyncItem, flushSyncQueue, PermanentSyncItemError } from '@/services/sync/syncQueue';
import { getCloudContext, stripUndefined } from './common';

function goalsPath(uid: string): string {
  return `users/${uid}/goals`;
}

async function setGoalInCloud(uid: string, db: Firestore, goal: Goal): Promise<void> {
  const ref = doc(db, `${goalsPath(uid)}/${goal.id}`);
  await setDoc(ref, stripUndefined({ ...goal, userId: uid, updatedAt: new Date().toISOString() }), {
    merge: true,
  });
}

async function deleteGoalInCloud(uid: string, db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, `${goalsPath(uid)}/${id}`));
}

function requireQueuedGoal(payload: unknown): Goal {
  const [goal] = normalizeGoals([payload]);
  if (!goal) {
    throw new PermanentSyncItemError('queued goal payload is invalid');
  }
  return goal;
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

export async function flushGoalQueue(): Promise<void> {
  await flushSyncQueue('goals', async (item) => {
    const context = await getCloudContext();
    if (!context) throw new Error('cloud context unavailable');

    if (item.action === 'setGoal') {
      await setGoalInCloud(context.uid, context.db, requireQueuedGoal(item.payload));
      return;
    }

    if (item.action === 'deleteGoal') {
      await deleteGoalInCloud(context.uid, context.db, requireQueuedId(item.payload, 'goal'));
      return;
    }

    throw new PermanentSyncItemError(`unsupported goals sync action "${item.action}"`);
  });
}

let isRefreshingGoals = false;

function runInBackground(task: () => Promise<void>): void {
  void task().catch((error) => {
    console.warn('Goals background sync task failed.', error);
  });
}

function refreshGoalsFromCloudInBackground(): void {
  if (isRefreshingGoals) return;
  isRefreshingGoals = true;

  runInBackground(async () => {
    try {
      const context = await getCloudContext();
      if (!context) return;

      await flushGoalQueue();
      const q = query(collection(context.db, goalsPath(context.uid)), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const goals = normalizeGoals(snap.docs.map((d) => d.data()));
      await goalLocalRepository.saveGoals(goals);
    } catch (error) {
      console.warn('Goals cloud refresh failed; keeping local cache.', error);
    } finally {
      isRefreshingGoals = false;
    }
  });
}

export const goalFirebaseRepository: GoalRepository = {
  async getAllGoals() {
    const localGoals = await goalLocalRepository.getAllGoals();
    refreshGoalsFromCloudInBackground();
    return localGoals;
  },

  async getGoalById(id) {
    const goals = await this.getAllGoals();
    return goals.find((g) => g.id === id);
  },

  async saveGoals(goals) {
    const normalizedGoals = normalizeGoals(goals);
    await goalLocalRepository.saveGoals(normalizedGoals);
    const context = await getCloudContext();
    if (!context) {
      for (const goal of normalizedGoals) {
        await enqueueSyncItem('goals', 'setGoal', goal);
      }
      return;
    }

    for (const goal of normalizedGoals) {
      try {
        await setGoalInCloud(context.uid, context.db, goal);
      } catch {
        await enqueueSyncItem('goals', 'setGoal', goal);
      }
    }
    await flushGoalQueue();
  },

  async addGoal(data) {
    const added = await goalLocalRepository.addGoal(data);
    const context = await getCloudContext();
    if (!context) {
      await enqueueSyncItem('goals', 'setGoal', added);
      return added;
    }

    try {
      await setGoalInCloud(context.uid, context.db, added);
      await flushGoalQueue();
    } catch {
      await enqueueSyncItem('goals', 'setGoal', added);
    }
    return added;
  },

  async updateGoal(id, updates) {
    const updated = await goalLocalRepository.updateGoal(id, updates);
    if (!updated) return null;
    const context = await getCloudContext();
    if (!context) {
      await enqueueSyncItem('goals', 'setGoal', updated);
      return updated;
    }

    try {
      await setGoalInCloud(context.uid, context.db, updated);
      await flushGoalQueue();
    } catch {
      await enqueueSyncItem('goals', 'setGoal', updated);
    }
    return updated;
  },

  async deleteGoal(id) {
    const normalizedId = requireRepositoryId(id, 'Goal');
    await goalLocalRepository.deleteGoal(normalizedId);
    const context = await getCloudContext();
    if (!context) {
      await enqueueSyncItem('goals', 'deleteGoal', normalizedId);
      return;
    }

    try {
      await deleteGoalInCloud(context.uid, context.db, normalizedId);
      await flushGoalQueue();
    } catch {
      await enqueueSyncItem('goals', 'deleteGoal', normalizedId);
    }
  },

  async incrementGoalProgress(id, amount) {
    const goal = await goalLocalRepository.incrementGoalProgress(id, amount);
    if (!goal) return null;
    await this.updateGoal(goal.id, goal);
    return goal;
  },

  async toggleMilestone(goalId, milestoneId) {
    const goal = await goalLocalRepository.toggleMilestone(goalId, milestoneId);
    if (!goal) return null;
    await this.updateGoal(goal.id, goal);
    return goal;
  },

  async getActiveGoalCount() {
    return goalLocalRepository.getActiveGoalCount();
  },
};
