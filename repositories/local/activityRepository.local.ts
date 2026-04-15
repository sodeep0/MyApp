import { storage } from '@/storage/asyncStorage';
import type { ActivityLog } from '@/types/models';
import { generateUUID } from '@/stores/baseStore';
import type { ActivityRepository } from '@/repositories/interfaces/activityRepository';

const ACTIVITY_KEY = 'kaarma_activity_logs';

export const activityLocalRepository: ActivityRepository = {
  async getAllActivities() {
    const entries = (await storage.getItem<ActivityLog[]>(ACTIVITY_KEY)) ?? [];
    return entries.sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  },

  async getActivityById(id) {
    const entries = await this.getAllActivities();
    return entries.find((e) => e.id === id);
  },

  async saveActivities(entries) {
    await storage.setItem(ACTIVITY_KEY, entries);
  },

  async addActivity(data) {
    const entries = await this.getAllActivities();
    const entry: ActivityLog = {
      ...data,
      id: generateUUID(),
      loggedAt: new Date().toISOString(),
    };
    await this.saveActivities([...entries, entry]);
    return entry;
  },

  async updateActivity(id, updates) {
    const entries = await this.getAllActivities();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    entries[idx] = { ...entries[idx], ...updates };
    await this.saveActivities(entries);
    return entries[idx];
  },

  async deleteActivity(id) {
    const entries = await this.getAllActivities();
    await this.saveActivities(entries.filter((e) => e.id !== id));
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
