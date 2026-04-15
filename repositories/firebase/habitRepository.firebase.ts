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
import type { HabitRepository } from '@/repositories/interfaces/habitRepository';
import { habitLocalRepository } from '@/repositories/local/habitRepository.local';
import { enqueueSyncItem, flushSyncQueue } from '@/services/sync/syncQueue';
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

export async function flushHabitQueue(): Promise<void> {
  await flushSyncQueue('habits', async (item) => {
    const context = await getCloudContext();
    if (!context) throw new Error('cloud context unavailable');

    if (item.action === 'setHabit') {
      await setHabitInCloud(context.uid, context.db, item.payload as Habit);
      return;
    }

    if (item.action === 'deleteHabit') {
      await deleteHabitInCloud(context.uid, context.db, item.payload as string);
      return;
    }

    if (item.action === 'setCompletion') {
      await setCompletionInCloud(context.uid, context.db, item.payload as HabitCompletion);
      return;
    }

    if (item.action === 'removeTodayCompletion') {
      await removeTodayCompletionInCloud(context.uid, context.db, item.payload as string);
    }
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

export const habitFirebaseRepository: HabitRepository = {
  async getAllHabits() {
    const context = await getCloudContext();
    if (!context) return habitLocalRepository.getAllHabits();

    await flushHabitQueue();
    const q = query(collection(context.db, habitsPath(context.uid)), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const habits = snap.docs.map((d) => d.data() as Habit);
    await habitLocalRepository.saveHabits(habits);
    return habits;
  },

  async getHabitById(id) {
    const habits = await this.getAllHabits();
    return habits.find((h) => h.id === id);
  },

  async saveHabits(habits) {
    await habitLocalRepository.saveHabits(habits);
    const context = await getCloudContext();
    if (!context) {
      for (const habit of habits) {
        await enqueueSyncItem('habits', 'setHabit', habit);
      }
      return;
    }

    for (const habit of habits) {
      try {
        await setHabitInCloud(context.uid, context.db, habit);
      } catch {
        await enqueueSyncItem('habits', 'setHabit', habit);
      }
    }
    await flushHabitQueue();
  },

  async addHabit(data) {
    const previousIds = new Set((await habitLocalRepository.getAllHabits()).map((h) => h.id));
    const listResult = await habitLocalRepository.addHabit(data);
    const latest = await habitLocalRepository.getAllHabits();
    const added = latest.find((h) => !previousIds.has(h.id));
    if (added) {
      const context = await getCloudContext();
      if (!context) {
        await enqueueSyncItem('habits', 'setHabit', added);
      } else {
        try {
          await setHabitInCloud(context.uid, context.db, added);
          await flushHabitQueue();
        } catch {
          await enqueueSyncItem('habits', 'setHabit', added);
        }
      }
    }
    return listResult;
  },

  async updateHabit(id, updates) {
    const updated = await habitLocalRepository.updateHabit(id, updates);
    if (!updated) return null;
    const context = await getCloudContext();
    if (!context) {
      await enqueueSyncItem('habits', 'setHabit', updated);
      return updated;
    }

    try {
      await setHabitInCloud(context.uid, context.db, updated);
      await flushHabitQueue();
    } catch {
      await enqueueSyncItem('habits', 'setHabit', updated);
    }
    return updated;
  },

  async deleteHabit(id) {
    await habitLocalRepository.deleteHabit(id);
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
  },

  async getCompletionsForHabit(habitId) {
    const context = await getCloudContext();
    if (!context) return habitLocalRepository.getCompletionsForHabit(habitId);

    await flushHabitQueue();
    const q = query(collection(context.db, completionsPath(context.uid, habitId)), orderBy('completedDate', 'desc'));
    const snap = await getDocs(q);
    const completions = snap.docs.map((d) => d.data() as HabitCompletion);

    const allHabits = await this.getAllHabits();
    const allCompletions: HabitCompletion[] = [];
    for (const habit of allHabits) {
      if (habit.id === habitId) {
        allCompletions.push(...completions);
      } else {
        allCompletions.push(...(await habitLocalRepository.getCompletionsForHabit(habit.id)));
      }
    }
    await habitLocalRepository.saveCompletions(allCompletions);
    return completions;
  },

  async getTodayCompletionsForHabit(habitId) {
    return habitLocalRepository.getTodayCompletionsForHabit(habitId);
  },

  async saveCompletions(completions) {
    await habitLocalRepository.saveCompletions(completions);
    for (const completion of completions) {
      await syncCompletionToCloud(completion);
    }
  },

  async markHabitComplete(habitId) {
    const completion = await habitLocalRepository.markHabitComplete(habitId);
    await syncCompletionToCloud(completion);
    return completion;
  },

  async unmarkHabitComplete(habitId) {
    await habitLocalRepository.unmarkHabitComplete(habitId);
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
  },
};
