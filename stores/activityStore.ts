// Activity log store
import type { ActivityLog } from '../types/models';
import { generateUUID } from './baseStore';

const ACTIVITY_KEY = 'kaarma_activity_logs';

export async function getAllActivities(): Promise<ActivityLog[]> {
  const { storage } = await import('../storage/asyncStorage');
  const entries = (await storage.getItem<ActivityLog[]>(ACTIVITY_KEY)) ?? [];
  return entries.sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}

export async function getActivityById(id: string): Promise<ActivityLog | undefined> {
  const entries = await getAllActivities();
  return entries.find((e) => e.id === id);
}

export async function saveActivities(entries: ActivityLog[]): Promise<void> {
  const { storage } = await import('../storage/asyncStorage');
  await storage.setItem(ACTIVITY_KEY, entries);
}

export async function addActivity(data: Omit<ActivityLog, 'id' | 'loggedAt'>): Promise<ActivityLog> {
  const entries = await getAllActivities();
  const entry: ActivityLog = {
    ...data,
    id: generateUUID(),
    loggedAt: new Date().toISOString(),
  };
  await saveActivities([...entries, entry]);
  return entry;
}

export async function updateActivity(id: string, updates: Partial<ActivityLog>): Promise<ActivityLog | null> {
  const entries = await getAllActivities();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  entries[idx] = { ...entries[idx], ...updates };
  await saveActivities(entries);
  return entries[idx];
}

export async function deleteActivity(id: string): Promise<void> {
  const entries = await getAllActivities();
  await saveActivities(entries.filter((e) => e.id !== id));
}

export function getWeeklySummary(): Promise<{ totalMinutes: number; byCategory: Record<string, number> }> {
  return getAllActivities().then((entries) => {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recent = entries.filter((e) => {
      const d = new Date(e.loggedAt);
      return d >= oneWeekAgo && d <= now;
    });

    const totalMinutes = recent.reduce((sum, e) => sum + e.durationMinutes, 0);
    const byCategory: Record<string, number> = {};
    recent.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.durationMinutes;
    });

    return { totalMinutes, byCategory };
  });
}

/**
 * Returns the most frequently logged activity names (for quick log).
 */
export async function getFrequentActivityNames(limit: number = 3): Promise<string[]> {
  const entries = await getAllActivities();
  const freq: Record<string, number> = {};
  entries.forEach((e) => {
    freq[e.name] = (freq[e.name] || 0) + 1;
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}
