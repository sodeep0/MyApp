// Bad habit & urge event store (local-only by policy; never sync to Firebase)
import type { BadHabit, UrgeEvent } from '../types/models';
import { generateUUID } from './baseStore';

const BAD_HABITS_KEY = 'kaarma_bad_habits';
const URGE_EVENTS_KEY = 'kaarma_urge_events';

// ─── Bad Habits ──────────────────────────────────────────────────────────────

export async function getAllBadHabits(): Promise<BadHabit[]> {
  const { storage } = await import('../storage/asyncStorage');
  return (await storage.getItem<BadHabit[]>(BAD_HABITS_KEY)) ?? [];
}

export async function getBadHabitById(id: string): Promise<BadHabit | undefined> {
  const habits = await getAllBadHabits();
  return habits.find((h) => h.id === id);
}

export async function saveBadHabits(habits: BadHabit[]): Promise<void> {
  const { storage } = await import('../storage/asyncStorage');
  await storage.setItem(BAD_HABITS_KEY, habits);
}

export async function addBadHabit(
  data: Omit<BadHabit, 'id' | 'createdAt'>,
): Promise<BadHabit> {
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
  const events = await getUrgeEventsForHabit(id);
  await saveUrgeEvents(events.filter((e) => e.badHabitId !== id));
}

export function countActiveBadHabits(): Promise<number> {
  return getAllBadHabits().then((habits) => habits.length);
}

// ─── Urge Events ─────────────────────────────────────────────────────────────

export async function getUrgeEventsForHabit(badHabitId: string): Promise<UrgeEvent[]> {
  const { storage } = await import('../storage/asyncStorage');
  const all = (await storage.getItem<UrgeEvent[]>(URGE_EVENTS_KEY)) ?? [];
  return all.filter((e) => e.badHabitId === badHabitId);
}

export async function getAllUrgeEvents(): Promise<UrgeEvent[]> {
  const { storage } = await import('../storage/asyncStorage');
  return (await storage.getItem<UrgeEvent[]>(URGE_EVENTS_KEY)) ?? [];
}

export async function saveUrgeEvents(events: UrgeEvent[]): Promise<void> {
  const { storage } = await import('../storage/asyncStorage');
  await storage.setItem(URGE_EVENTS_KEY, events);
}

export async function logUrgeEvent(data: Omit<UrgeEvent, 'id' | 'loggedAt'>): Promise<UrgeEvent> {
  const { storage } = await import('../storage/asyncStorage');
  const all = (await storage.getItem<UrgeEvent[]>(URGE_EVENTS_KEY)) ?? [];
  const event: UrgeEvent = { ...data, id: generateUUID(), loggedAt: new Date().toISOString() };
  await storage.setItem(URGE_EVENTS_KEY, [...all, event]);
  return event;
}

export function daysSinceQuit(quitDateStr: string): number {
  const quitDate = new Date(quitDateStr);
  const now = new Date();
  const diffMs = now.getTime() - quitDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
