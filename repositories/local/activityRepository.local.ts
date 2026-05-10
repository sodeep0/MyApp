import { storage } from '@/storage/asyncStorage';
import type { ActivityLog } from '@/types/models';
import { generateUUID } from '@/stores/baseStore';
import type { ActivityRepository } from '@/repositories/interfaces/activityRepository';
import { normalizeActivities } from '@/repositories/activityNormalization';
import {
  ActivityEditWindowExpiredError,
  canEditActivityLog,
} from '@/constants/featureLimits';

const ACTIVITY_KEY = 'kaarma_activity_logs';

function requireValidActivity(entry: ActivityLog, message: string): ActivityLog {
  const [normalizedEntry] = normalizeActivities([entry]);
  if (!normalizedEntry) {
    throw new Error(message);
  }
  return normalizedEntry;
}

function requireActivityId(id: string): string {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Activity id must be a non-empty string.');
  }
  return id.trim();
}

export async function clearActivityLocalCache(): Promise<void> {
  await storage.removeItem(ACTIVITY_KEY);
}

export const activityLocalRepository: ActivityRepository = {
  async getAllActivities() {
    const entries = normalizeActivities(await storage.getItem<unknown>(ACTIVITY_KEY, []));
    return entries.sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  },

  async getActivityById(id) {
    const entries = await this.getAllActivities();
    return entries.find((e) => e.id === id);
  },

  async saveActivities(entries) {
    await storage.setItem(ACTIVITY_KEY, normalizeActivities(entries));
  },

  async addActivity(data) {
    const entries = await this.getAllActivities();
    const entry: ActivityLog = {
      ...data,
      id: generateUUID(),
      loggedAt: new Date().toISOString(),
    };
    const normalizedEntry = requireValidActivity(entry, 'Activity data must be valid before saving.');
    await this.saveActivities([...entries, normalizedEntry]);
    return normalizedEntry;
  },

  async updateActivity(id, updates) {
    const entries = await this.getAllActivities();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    if (!canEditActivityLog(entries[idx].loggedAt)) {
      throw new ActivityEditWindowExpiredError();
    }
    entries[idx] = requireValidActivity(
      { ...entries[idx], ...updates },
      'Activity update would create invalid activity data.',
    );
    await this.saveActivities(entries);
    return entries[idx];
  },

  async deleteActivity(id) {
    const normalizedId = requireActivityId(id);
    const entries = await this.getAllActivities();
    await this.saveActivities(entries.filter((e) => e.id !== normalizedId));
  },

  async getWeeklySummary() {
    const entries = await this.getAllActivities();
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
  },

  async getFrequentActivityNames(limit = 3) {
    const entries = await this.getAllActivities();
    const freq: Record<string, number> = {};
    entries.forEach((e) => {
      freq[e.name] = (freq[e.name] || 0) + 1;
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name]) => name);
  },
};
