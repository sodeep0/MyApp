// Activity log store
import type { ActivityLog } from '../types/models';
import { getActivityRepository } from '@/repositories/factory';

function repo() {
  return getActivityRepository();
}

export async function getAllActivities(): Promise<ActivityLog[]> {
  return repo().getAllActivities();
}

export async function getActivityById(id: string): Promise<ActivityLog | undefined> {
  return repo().getActivityById(id);
}

export async function saveActivities(entries: ActivityLog[]): Promise<void> {
  await repo().saveActivities(entries);
}

export async function addActivity(data: Omit<ActivityLog, 'id' | 'loggedAt'>): Promise<ActivityLog> {
  return repo().addActivity(data);
}

export async function updateActivity(id: string, updates: Partial<ActivityLog>): Promise<ActivityLog | null> {
  return repo().updateActivity(id, updates);
}

export async function deleteActivity(id: string): Promise<void> {
  await repo().deleteActivity(id);
}

export function getWeeklySummary(): Promise<{ totalMinutes: number; byCategory: Record<string, number> }> {
  return repo().getWeeklySummary();
}

/**
 * Returns the most frequently logged activity names (for quick log).
 */
export async function getFrequentActivityNames(limit: number = 3): Promise<string[]> {
  return repo().getFrequentActivityNames(limit);
}
