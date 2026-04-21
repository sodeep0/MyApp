import type { Goal } from '@/types/models';
import { GoalStatus } from '@/types/models';
import { storage } from '@/storage/asyncStorage';
import { generateUUID } from '@/stores/baseStore';
import type { GoalRepository } from '@/repositories/interfaces/goalRepository';

const GOALS_KEY = 'kaarma_goals';

export async function clearGoalLocalCache(): Promise<void> {
  await storage.removeItem(GOALS_KEY);
}

export const goalLocalRepository: GoalRepository = {
  async getAllGoals() {
    return (await storage.getItem<Goal[]>(GOALS_KEY)) ?? [];
  },

  async getGoalById(id) {
    const goals = await this.getAllGoals();
    return goals.find((g) => g.id === id);
  },

  async saveGoals(goals) {
    await storage.setItem(GOALS_KEY, goals);
  },

  async addGoal(data) {
    const goals = await this.getAllGoals();
    const newGoal: Goal = {
      ...data,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    await this.saveGoals([...goals, newGoal]);
    return newGoal;
  },

  async updateGoal(id, updates) {
    const goals = await this.getAllGoals();
    const idx = goals.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    goals[idx] = { ...goals[idx], ...updates };
    await this.saveGoals(goals);
    return goals[idx];
  },

  async deleteGoal(id) {
    const goals = await this.getAllGoals();
    await this.saveGoals(goals.filter((g) => g.id !== id));
  },

  async incrementGoalProgress(id, amount) {
    const goals = await this.getAllGoals();
    const goal = goals.find((g) => g.id === id);
    if (!goal) return null;

    const newValue = goal.currentValue + amount;
    goals[goals.indexOf(goal)] = {
      ...goal,
      currentValue: newValue,
      status: goal.targetValue !== null && newValue >= goal.targetValue ? GoalStatus.COMPLETED : goal.status,
      completedAt: goal.targetValue !== null && newValue >= goal.targetValue ? new Date().toISOString() : goal.completedAt,
    };
    await this.saveGoals(goals);
    return goals[goals.indexOf(goal)];
  },

  async toggleMilestone(goalId, milestoneId) {
    const goal = await this.getGoalById(goalId);
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

    return this.updateGoal(goalId, { milestones });
  },

  async getActiveGoalCount() {
    const goals = await this.getAllGoals();
    return goals.filter((g) => g.status === 'ACTIVE').length;
  },
};
