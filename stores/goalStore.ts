import type { Goal } from '../types/models';
import { getGoalRepository } from '@/repositories/factory';

function repo() {
  return getGoalRepository();
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
  return repo().addGoal(data);
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | null> {
  return repo().updateGoal(id, updates);
}

export async function deleteGoal(id: string): Promise<void> {
  await repo().deleteGoal(id);
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
