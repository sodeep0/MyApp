// Bad habit & urge event store (local-only by policy; never sync to Firebase)
import type { BadHabit, UrgeEvent } from '../types/models';
import { normalizeBadHabits, normalizeUrgeEvents } from './badHabitEntryNormalization';
import { generateUUID } from './baseStore';
import { enforceCountLimitedFeatureGate } from '@/services/featureAccess';
import { getSensitiveItem, setSensitiveItem } from '@/storage/secureDataStorage';
export {
  bestStreakDays,
  currentStreakDays,
  daysSinceQuit,
  totalCleanDays,
} from '@/stores/badHabitMetrics';

const BAD_HABITS_KEY = 'kaarma_bad_habits';
const URGE_EVENTS_KEY = 'kaarma_urge_events';
const BAD_HABITS_SECURE_KEY = 'kaarma_secure_bad_habits_v1';
const URGE_EVENTS_SECURE_KEY = 'kaarma_secure_urge_events_v1';

// ─── Bad Habits ──────────────────────────────────────────────────────────────

export async function getAllBadHabits(): Promise<BadHabit[]> {
  const habits = await getSensitiveItem<unknown>({
    secureKey: BAD_HABITS_SECURE_KEY,
    legacyKey: BAD_HABITS_KEY,
    defaultValue: [],
  });
  return normalizeBadHabits(habits);
}

export async function getBadHabitById(id: string): Promise<BadHabit | undefined> {
  const habits = await getAllBadHabits();
  return habits.find((h) => h.id === id);
}

export async function saveBadHabits(habits: BadHabit[]): Promise<void> {
  await setSensitiveItem({
    secureKey: BAD_HABITS_SECURE_KEY,
    legacyKey: BAD_HABITS_KEY,
    value: normalizeBadHabits(habits),
  });
}

export async function addBadHabit(
  data: Omit<BadHabit, 'id' | 'createdAt'>,
): Promise<BadHabit> {
  await enforceCountLimitedFeatureGate('badHabits', countActiveBadHabits);

  const habits = await getAllBadHabits();
  const newHabit: BadHabit = {
    ...data,
    id: generateUUID(),
    createdAt: new Date().toISOString(),
  };
  await saveBadHabits([...habits, newHabit]);
  return newHabit;
}

export async function updateBadHabit(id: string, updates: Partial<BadHabit>): Promise<BadHabit | null> {
  const habits = await getAllBadHabits();
  const idx = habits.findIndex((h) => h.id === id);
  if (idx === -1) return null;
  habits[idx] = { ...habits[idx], ...updates };
  await saveBadHabits(habits);
  return habits[idx];
}

export async function deleteBadHabit(id: string): Promise<void> {
  const habits = await getAllBadHabits();
  await saveBadHabits(habits.filter((h) => h.id !== id));
  // Also delete urge events for this habit
  const events = await getAllUrgeEvents();
  await saveUrgeEvents(events.filter((e) => e.badHabitId !== id));
}

export function countActiveBadHabits(): Promise<number> {
  return getAllBadHabits().then((habits) => habits.length);
}

// ─── Urge Events ─────────────────────────────────────────────────────────────

export async function getUrgeEventsForHabit(badHabitId: string): Promise<UrgeEvent[]> {
  const all = await getAllUrgeEvents();
  return all.filter((e) => e.badHabitId === badHabitId);
}

export async function getAllUrgeEvents(): Promise<UrgeEvent[]> {
  const events = await getSensitiveItem<unknown>({
    secureKey: URGE_EVENTS_SECURE_KEY,
    legacyKey: URGE_EVENTS_KEY,
    defaultValue: [],
  });
  return normalizeUrgeEvents(events);
}

export async function saveUrgeEvents(events: UrgeEvent[]): Promise<void> {
  await setSensitiveItem({
    secureKey: URGE_EVENTS_SECURE_KEY,
    legacyKey: URGE_EVENTS_KEY,
    value: normalizeUrgeEvents(events),
  });
}

export async function logUrgeEvent(data: Omit<UrgeEvent, 'id' | 'loggedAt'>): Promise<UrgeEvent> {
  const all = await getAllUrgeEvents();
  const event: UrgeEvent = { ...data, id: generateUUID(), loggedAt: new Date().toISOString() };
  await saveUrgeEvents([...all, event]);
  return event;
}
