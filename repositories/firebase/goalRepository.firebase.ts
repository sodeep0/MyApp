import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
  type Firestore,
} from 'firebase/firestore';
import type { Goal } from '@/types/models';
import { GoalStatus } from '@/types/models';
import type { GoalRepository } from '@/repositories/interfaces/goalRepository';
import { goalLocalRepository } from '@/repositories/local/goalRepository.local';
import { enqueueSyncItem, flushSyncQueue } from '@/services/sync/syncQueue';
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

export async function flushGoalQueue(): Promise<void> {
  await flushSyncQueue('goals', async (item) => {
    const context = await getCloudContext();
    if (!context) throw new Error('cloud context unavailable');

    if (item.action === 'setGoal') {
      await setGoalInCloud(context.uid, context.db, item.payload as Goal);
      return;
    }

    if (item.action === 'deleteGoal') {
      await deleteGoalInCloud(context.uid, context.db, item.payload as string);
    }
  });
}

export const goalFirebaseRepository: GoalRepository = {
  async getAllGoals() {
    const context = await getCloudContext();
    if (!context) return goalLocalRepository.getAllGoals();

    await flushGoalQueue();
    const q = query(collection(context.db, goalsPath(context.uid)), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const goals = snap.docs.map((d) => d.data() as Goal);
    await goalLocalRepository.saveGoals(goals);
    return goals;
  },

  async getGoalById(id) {
    const goals = await this.getAllGoals();
    return goals.find((g) => g.id === id);
  },

  async saveGoals(goals) {
    await goalLocalRepository.saveGoals(goals);
    const context = await getCloudContext();
    if (!context) {
      for (const goal of goals) {
        await enqueueSyncItem('goals', 'setGoal', goal);
      }
      return;
    }

    for (const goal of goals) {
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
    await goalLocalRepository.deleteGoal(id);
    const context = await getCloudContext();
    if (!context) {
      await enqueueSyncItem('goals', 'deleteGoal', id);
      return;
    }

    try {
      await deleteGoalInCloud(context.uid, context.db, id);
      await flushGoalQueue();
    } catch {
      await enqueueSyncItem('goals', 'deleteGoal', id);
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
    const context = await getCloudContext();
    if (!context) {
      return goalLocalRepository.getActiveGoalCount();
    }

    await flushGoalQueue();
    const q = query(
      collection(context.db, goalsPath(context.uid)),
      where('status', '==', GoalStatus.ACTIVE),
      orderBy('updatedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.size;
  },
};
