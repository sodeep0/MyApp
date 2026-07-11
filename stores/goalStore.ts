import type { Goal, Milestone } from '../types/models';
import { getGoalRepository } from '@/repositories/factory';
import { syncManagedNotificationsAsync } from '@/services/notifications';
import { invalidate } from '@/stores/invalidate';
import { generateUUID } from '@/utils/id';

function repo() {
  return getGoalRepository();
}

async function syncNotificationsAfterGoalChange(): Promise<void> {
  try {
    await syncManagedNotificationsAsync();
  } catch (error) {
    console.warn('Failed to sync notifications after goal change', error);
  }
}

export function createMilestone(title: string): Milestone {
  return {
    id: generateUUID(),
    title: title.trim(),
    isCompleted: false,
    completedAt: null,
  };
}

export async function getAllGoals(): Promise<Goal[]> {
  return repo().getAllGoals();
}

export async function getGoalById(id: string): Promise<Goal | undefined> {
  return repo().getGoalById(id);
}

export async function saveGoals(goals: Goal[]): Promise<void> {
  await repo().saveGoals(goals);
  invalidate('goals');
}

export async function addGoal(data: Omit<Goal, 'id' | 'createdAt' | 'completedAt'>): Promise<Goal> {
  const goal = await repo().addGoal(data);
  invalidate('goals');
  await syncNotificationsAfterGoalChange();
  return goal;
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | null> {
  const goal = await repo().updateGoal(id, updates);
  invalidate('goals');
  await syncNotificationsAfterGoalChange();
  return goal;
}

export async function deleteGoal(id: string): Promise<void> {
  await repo().deleteGoal(id);
  invalidate('goals');
  await syncNotificationsAfterGoalChange();
}

export async function incrementGoalProgress(id: string, amount: number): Promise<Goal | null> {
  const goal = await repo().incrementGoalProgress(id, amount);
  invalidate('goals');
  return goal;
}

export async function toggleMilestone(goalId: string, milestoneId: string): Promise<Goal | null> {
  const goal = await repo().toggleMilestone(goalId, milestoneId);
  invalidate('goals');
  return goal;
}

export function getActiveGoalCount(): Promise<number> {
  return repo().getActiveGoalCount();
}
