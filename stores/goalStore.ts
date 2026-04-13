import type { Goal } from '../types/models';
import { GoalStatus } from '../types/models';
import { generateUUID } from './baseStore';

const GOALS_KEY = 'kaarma_goals';

export async function getAllGoals(): Promise<Goal[]> {
  const { storage } = await import('../storage/asyncStorage');
  return (await storage.getItem<Goal[]>(GOALS_KEY)) ?? [];
}

export async function getGoalById(id: string): Promise<Goal | undefined> {
  const goals = await getAllGoals();
  return goals.find((g) => g.id === id);
}

export async function saveGoals(goals: Goal[]): Promise<void> {
  const { storage } = await import('../storage/asyncStorage');
  await storage.setItem(GOALS_KEY, goals);
}

export async function addGoal(data: Omit<Goal, 'id' | 'createdAt' | 'completedAt'>): Promise<Goal> {
  const goals = await getAllGoals();
  const newGoal: Goal = {
    ...data,
    id: generateUUID(),
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  await saveGoals([...goals, newGoal]);
  return newGoal;
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | null> {
  const goals = await getAllGoals();
  const idx = goals.findIndex((g) => g.id === id);
  if (idx === -1) return null;
  goals[idx] = { ...goals[idx], ...updates };
  await saveGoals(goals);
  return goals[idx];
}

export async function deleteGoal(id: string): Promise<void> {
  const goals = await getAllGoals();
  await saveGoals(goals.filter((g) => g.id !== id));
}

export async function incrementGoalProgress(id: string, amount: number): Promise<Goal | null> {
  const goals = await getAllGoals();
  const goal = goals.find((g) => g.id === id);
  if (!goal) return null;

  const newValue = goal.currentValue + amount;
  goals[goals.indexOf(goal)] = {
    ...goal,
    currentValue: newValue,
    status: goal.targetValue !== null && newValue >= goal.targetValue ? GoalStatus.COMPLETED : goal.status,
    completedAt: goal.targetValue !== null && newValue >= goal.targetValue ? new Date().toISOString() : goal.completedAt,
  };
  await saveGoals(goals);
  return goals[goals.indexOf(goal)];
}

export async function toggleMilestone(goalId: string, milestoneId: string): Promise<Goal | null> {
  const goal = await getGoalById(goalId);
  if (!goal) return null;

  const milestones = goal.milestones.map((m) => {
    if (m.id === milestoneId) {
      return {
        ...m,
        isCompleted: !m.isCompleted,
        completedAt: !m.isCompleted ? new Date().toISOString() : null,
      };
    }
    return m;
  });

  return updateGoal(goalId, { milestones });
}

export function getActiveGoalCount(): Promise<number> {
  return getAllGoals().then((goals) => goals.filter((g) => g.status === 'ACTIVE').length);
}
