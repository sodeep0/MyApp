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
import { captureMessage } from '@/services/observability';
import { getCloudContext, stripUndefined, toIsoString } from './common';
import { createRefreshGuard, requireQueuedId, runInBackground } from './commonSync';
import { mergeByUpdatedAt } from './mergeByUpdatedAt';

/** Completions live at users/{uid}/habits/{habitId}/completions/{completionId}. */
const COMPLETION_FETCH_CHUNK = 8;

function habitsPath(uid: string): string {
  return `users/${uid}/habits`;
}

function completionsPath(uid: string, habitId: string): string {
  return `users/${uid}/habits/${habitId}/completions`;
}

type HabitWithUpdatedAt = Habit & { updatedAt?: string | null };
type CompletionWithUpdatedAt = HabitCompletion & { updatedAt?: string | null };

function normalizeCloudHabitDoc(data: Record<string, unknown>): unknown {
  return {
    ...data,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : toIsoString(data.createdAt),
    updatedAt: data.updatedAt != null ? toIsoString(data.updatedAt) : undefined,
  };
}

function normalizeCloudCompletionDoc(data: Record<string, unknown>): unknown {
  const completedAt = typeof data.completedAt === 'string'
    ? data.completedAt
    : toIsoString(data.completedAt);
  const updatedAt = data.updatedAt != null
    ? toIsoString(data.updatedAt)
    : completedAt;
  return {
    ...data,
    completedAt,
    updatedAt,
  };
}

async function fetchCompletionsForHabits(
  uid: string,
  db: Firestore,
  habitIds: string[],
): Promise<CompletionWithUpdatedAt[]> {
  const all: CompletionWithUpdatedAt[] = [];

  for (let index = 0; index < habitIds.length; index += COMPLETION_FETCH_CHUNK) {
    const chunk = habitIds.slice(index, index + COMPLETION_FETCH_CHUNK);
    const chunkResults = await Promise.all(
      chunk.map(async (habitId) => {
        const snap = await getDocs(collection(db, completionsPath(uid, habitId)));
        return normalizeHabitCompletions(
          snap.docs.map((entry) => normalizeCloudCompletionDoc(entry.data() as Record<string, unknown>)),
        );
      }),
    );
    all.push(...chunkResults.flat());
  }

  return all;
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
  const now = new Date().toISOString();
  const payload = {
    ...completion,
    userId: uid,
    updatedAt: completion.updatedAt ?? completion.completedAt ?? now,
  };
  const ref = doc(db, `${completionsPath(uid, completion.habitId)}/${completion.id}`);
  await setDoc(ref, stripUndefined(payload), {
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

const habitsRefreshGuard = createRefreshGuard('Habits cloud refresh failed; keeping local cache.');

function refreshHabitsFromCloudInBackground(): void {
  habitsRefreshGuard.run(async () => {
    const context = await getCloudContext();
    if (!context) return;

    await flushHabitQueue();
    const q = query(collection(context.db, habitsPath(context.uid)), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const remoteHabits = normalizeHabits(
      snap.docs.map((d) => normalizeCloudHabitDoc(d.data() as Record<string, unknown>)),
    ) as HabitWithUpdatedAt[];
    const localHabits = (await habitLocalRepository.getAllHabits()) as HabitWithUpdatedAt[];
    const mergedHabits = mergeByUpdatedAt(localHabits, remoteHabits);
    await habitLocalRepository.saveHabits(mergedHabits);

    // Completions: users/{uid}/habits/{habitId}/completions/{completionId}
    const habitIds = mergedHabits.map((habit) => habit.id);
    const remoteCompletions = await fetchCompletionsForHabits(
      context.uid,
      context.db,
      habitIds,
    );
    const localCompletions = (await habitLocalRepository.getAllCompletions()) as CompletionWithUpdatedAt[];
    const mergedCompletions = mergeByUpdatedAt(localCompletions, remoteCompletions);
    await habitLocalRepository.saveCompletions(mergedCompletions);
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
    } catch (error) {
      captureMessage('habits cloud write failed; enqueueing', 'warning', {
        action: 'setHabit',
        error: String(error),
      });
      await enqueueSyncItem('habits', 'setHabit', habit);
    }
  }, 'Habits background sync task failed.');
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
    } catch (error) {
      captureMessage('habits cloud write failed; enqueueing', 'warning', {
        action: 'deleteHabit',
        error: String(error),
      });
      await enqueueSyncItem('habits', 'deleteHabit', id);
    }
  }, 'Habits background sync task failed.');
}

function queueOrPushCompletionInBackground(completion: HabitCompletion): void {
  runInBackground(async () => {
    await syncCompletionToCloud(completion);
  }, 'Habits background sync task failed.');
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
    } catch (error) {
      captureMessage('habits cloud write failed; enqueueing', 'warning', {
        action: 'removeTodayCompletion',
        error: String(error),
      });
      await enqueueSyncItem('habits', 'removeTodayCompletion', habitId);
    }
  }, 'Habits background sync task failed.');
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
  } catch (error) {
    captureMessage('habits cloud write failed; enqueueing', 'warning', {
      action: 'setCompletion',
      error: String(error),
    });
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
