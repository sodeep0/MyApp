import type { Goal } from '@/types/models';

export interface GoalRepository {
  getAllGoals(): Promise<Goal[]>;
  getGoalById(id: string): Promise<Goal | undefined>;
  saveGoals(goals: Goal[]): Promise<void>;
  addGoal(data: Omit<Goal, 'id' | 'createdAt' | 'completedAt'>): Promise<Goal>;
  updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | null>;
  deleteGoal(id: string): Promise<void>;
  incrementGoalProgress(id: string, amount: number): Promise<Goal | null>;
  toggleMilestone(goalId: string, milestoneId: string): Promise<Goal | null>;
  getActiveGoalCount(): Promise<number>;
}
