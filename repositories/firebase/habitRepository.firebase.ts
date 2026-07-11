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
import type { Habit, HabitCompletion } from '@/types/models';
import { normalizeHabitCompletions, normalizeHabits } from '@/repositories/habitNormalization';
import type { HabitRepository } from '@/repositories/interfaces/habitRepository';
import { habitLocalRepository } from '@/repositories/local/habitRepository.local';
import { enqueueSyncItem, flushSyncQueue, PermanentSyncItemError } from '@/services/sync/syncQueue';
import { getCloudContext, stripUndefined } from './common';

function habitsPath(uid: string): string {
  return `users/${uid}/habits`;
}

function completionsPath(uid: string, habitId: string): string {
  return `users/${uid}/habits/${habitId}/completions`;
}

async function setHabitInCloud(uid: string, db: Firestore, habit: Habit): Promise<void> {
  const ref = doc(db, `${habitsPath(uid)}/${habit.id}`);
  await setDoc(ref, stripUndefined({ ...habit, userId: uid, updatedAt: new Date().toISOString() }), {
    merge: true,
  });
}

async function deleteHabitInCloud(uid: string, db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, `${habitsPath(uid)}/${id}`));
}

async function setCompletionInCloud(uid: string, db: Firestore, completion: HabitCompletion): Promise<void> {
  const ref = doc(db, `${completionsPath(uid, completion.habitId)}/${completion.id}`);
  await setDoc(ref, stripUndefined({ ...completion, userId: uid, updatedAt: new Date().toISOString() }), {
    merge: true,
  });
}

async function removeTodayCompletionInCloud(uid: string, db: Firestore, habitId: string): Promise<void> {
  const completionQ = query(collection(db, completionsPath(uid, habitId)), orderBy('completedDate', 'desc'));
  const snap = await getDocs(completionQ);
  const today = new Date().toISOString().slice(0, 10);
  const target = snap.docs.find((d) => d.data().completedDate === today);
  if (target) {
    await deleteDoc(target.ref);
  }
}

let isRefreshingHabits = false;

function runInBackground(task: () => Promise<void>): void {
  void task().catch((error) => {
    console.warn('Habits background sync task failed.', error);
  });
}

function queueOrPushHabitInBackground(habit: Habit): void {
  runInBackground(async () => {
    const context = await getCloudContext();
    if (!context) {
      await enqueueSyncItem('habits', 'setHabit', habit);
      return;
    }

    try {
      await setHabitInCloud(context.uid, context.db, habit);
      await flushHabitQueue();
    } catch {
      await enqueueSyncItem('habits', 'setHabit', habit);
    }
  });
}

function queueOrDeleteHabitInBackground(id: string): void {
  runInBackground(async () => {
    const context = await getCloudContext();
    if (!context) {
      await enqueueSyncItem('habits', 'deleteHabit', id);
      return;
    }

    try {
      await deleteHabitInCloud(context.uid, context.db, id);
      await flushHabitQueue();
    } catch {
      await enqueueSyncItem('habits', 'deleteHabit', id);
    }
  });
}

function queueOrPushCompletionInBackground(completion: HabitCompletion): void {
  runInBackground(async () => {
    await syncCompletionToCloud(completion);
  });
}

function queueOrRemoveCompletionInBackground(habitId: string): void {
  runInBackground(async () => {
    const context = await getCloudContext();
    if (!context) {
      await enqueueSyncItem('habits', 'removeTodayCompletion', habitId);
      return;
    }

    try {
      await removeTodayCompletionInCloud(context.uid, context.db, habitId);
      await flushHabitQueue();
    } catch {
      await enqueueSyncItem('habits', 'removeTodayCompletion', habitId);
    }
  });
}

function refreshHabitsFromCloudInBackground(): void {
  if (isRefreshingHabits) return;
  isRefreshingHabits = true;

  runInBackground(async () => {
    try {
      const context = await getCloudContext();
      if (!context) return;

      await flushHabitQueue();
      const q = query(collection(context.db, habitsPath(context.uid)), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const habits = normalizeHabits(snap.docs.map((d) => d.data()));
      await habitLocalRepository.saveHabits(habits);
    } finally {
      isRefreshingHabits = false;
    }
  });
}

export async function flushHabitQueue(): Promise<void> {
  await flushSyncQueue('habits', async (item) => {
    const context = await getCloudContext();
    if (!context) throw new Error('cloud context unavailable');

    if (item.action === 'setHabit') {
      await setHabitInCloud(context.uid, context.db, requireQueuedHabit(item.payload));
      return;
    }

    if (item.action === 'deleteHabit') {
      await deleteHabitInCloud(context.uid, context.db, requireQueuedId(item.payload, 'habit'));
      return;
    }

    if (item.action === 'setCompletion') {
      await setCompletionInCloud(context.uid, context.db, requireQueuedCompletion(item.payload));
      return;
    }

    if (item.action === 'removeTodayCompletion') {
      await removeTodayCompletionInCloud(context.uid, context.db, requireQueuedId(item.payload, 'habit'));
      return;
    }

    throw new PermanentSyncItemError(`unsupported habits sync action "${item.action}"`);
  });
}

async function syncCompletionToCloud(completion: HabitCompletion): Promise<void> {
  const context = await getCloudContext();
  if (!context) {
    await enqueueSyncItem('habits', 'setCompletion', completion);
    return;
  }

  try {
    await setCompletionInCloud(context.uid, context.db, completion);
    await flushHabitQueue();
  } catch {
    await enqueueSyncItem('habits', 'setCompletion', completion);
  }
}

function requireQueuedHabit(payload: unknown): Habit {
  const [habit] = normalizeHabits([payload]);
  if (!habit) {
    throw new PermanentSyncItemError('queued habit payload is invalid');
  }
  return habit;
}

function requireQueuedCompletion(payload: unknown): HabitCompletion {
  const [completion] = normalizeHabitCompletions([payload]);
  if (!completion) {
    throw new PermanentSyncItemError('queued habit completion payload is invalid');
  }
  return completion;
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

export const habitFirebaseRepository: HabitRepository = {
  async getAllHabits() {
    const localHabits = await habitLocalRepository.getAllHabits();
    refreshHabitsFromCloudInBackground();
    return localHabits;
  },

  async getHabitById(id) {
    const habits = await this.getAllHabits();
    return habits.find((h) => h.id === id);
  },

  async saveHabits(habits) {
    const normalizedHabits = normalizeHabits(habits);
    await habitLocalRepository.saveHabits(normalizedHabits);
    for (const habit of normalizedHabits) {
      queueOrPushHabitInBackground(habit);
    }
  },

  async addHabit(data) {
    const previousIds = new Set((await habitLocalRepository.getAllHabits()).map((h) => h.id));
    const listResult = await habitLocalRepository.addHabit(data);
    const latest = await habitLocalRepository.getAllHabits();
    const added = latest.find((h) => !previousIds.has(h.id));
    if (added) {
      queueOrPushHabitInBackground(added);
    }
    return listResult;
  },

  async updateHabit(id, updates) {
    const updated = await habitLocalRepository.updateHabit(id, updates);
    if (!updated) return null;
    queueOrPushHabitInBackground(updated);
    return updated;
  },

  async deleteHabit(id) {
    const normalizedId = requireRepositoryId(id, 'Habit');
    await habitLocalRepository.deleteHabit(normalizedId);
    queueOrDeleteHabitInBackground(normalizedId);
  },

  async getCompletionsForHabit(habitId) {
    return habitLocalRepository.getCompletionsForHabit(habitId);
  },

  async getAllCompletions() {
    return habitLocalRepository.getAllCompletions();
  },

  async getTodayCompletionsForHabit(habitId) {
    return habitLocalRepository.getTodayCompletionsForHabit(habitId);
  },

  async saveCompletions(completions) {
    const normalizedCompletions = normalizeHabitCompletions(completions);
    await habitLocalRepository.saveCompletions(normalizedCompletions);
    for (const completion of normalizedCompletions) {
      queueOrPushCompletionInBackground(completion);
    }
  },

  async markHabitComplete(habitId) {
    const completion = await habitLocalRepository.markHabitComplete(habitId);
    queueOrPushCompletionInBackground(completion);
    return completion;
  },

  async unmarkHabitComplete(habitId) {
    const normalizedId = requireRepositoryId(habitId, 'Habit');
    await habitLocalRepository.unmarkHabitComplete(normalizedId);
    queueOrRemoveCompletionInBackground(normalizedId);
  },
};
