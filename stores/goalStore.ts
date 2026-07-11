import type { Goal } from '../types/models';
import { getGoalRepository } from '@/repositories/factory';
import { syncManagedNotificationsAsync } from '@/services/notifications';

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

export async function getAllGoals(): Promise<Goal[]> {
  return repo().getAllGoals();
}

export async function getGoalById(id: string): Promise<Goal | undefined> {
  return repo().getGoalById(id);
}

export async function saveGoals(goals: Goal[]): Promise<void> {
  await repo().saveGoals(goals);
}

export async function addGoal(data: Omit<Goal, 'id' | 'createdAt' | 'completedAt'>): Promise<Goal> {
  const goal = await repo().addGoal(data);
  await syncNotificationsAfterGoalChange();
  return goal;
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | null> {
  const goal = await repo().updateGoal(id, updates);
  await syncNotificationsAfterGoalChange();
  return goal;
}

export async function deleteGoal(id: string): Promise<void> {
  await repo().deleteGoal(id);
  await syncNotificationsAfterGoalChange();
}

export async function incrementGoalProgress(id: string, amount: number): Promise<Goal | null> {
  return repo().incrementGoalProgress(id, amount);
}

export async function toggleMilestone(goalId: string, milestoneId: string): Promise<Goal | null> {
  return repo().toggleMilestone(goalId, milestoneId);
}

export function getActiveGoalCount(): Promise<number> {
  return repo().getActiveGoalCount();
}
