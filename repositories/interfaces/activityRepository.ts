import type { ActivityLog } from '@/types/models';

export interface ActivityRepository {
  getAllActivities(): Promise<ActivityLog[]>;
  getActivityById(id: string): Promise<ActivityLog | undefined>;
  saveActivities(entries: ActivityLog[]): Promise<void>;
  addActivity(data: Omit<ActivityLog, 'id' | 'loggedAt'>): Promise<ActivityLog>;
  updateActivity(id: string, updates: Partial<ActivityLog>): Promise<ActivityLog | null>;
  deleteActivity(id: string): Promise<void>;
  getWeeklySummary(): Promise<{ totalMinutes: number; byCategory: Record<string, number> }>;
  getFrequentActivityNames(limit?: number): Promise<string[]>;
}
