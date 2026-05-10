import type { Goal } from '@/types/models';
import { GoalStatus } from '@/types/models';
import { storage } from '@/storage/asyncStorage';
import { generateUUID } from '@/stores/baseStore';
import type { GoalRepository } from '@/repositories/interfaces/goalRepository';
import { enforceCountLimitedFeatureGate } from '@/services/featureAccess';
import { normalizeGoals } from '@/repositories/goalNormalization';

const GOALS_KEY = 'kaarma_goals';

function requireValidGoal(goal: Goal, message: string): Goal {
  const [normalizedGoal] = normalizeGoals([goal]);
  if (!normalizedGoal) {
    throw new Error(message);
  }
  return normalizedGoal;
}

function requireGoalId(id: string): string {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Goal id must be a non-empty string.');
  }
  return id.trim();
}

export async function clearGoalLocalCache(): Promise<void> {
  await storage.removeItem(GOALS_KEY);
}

export const goalLocalRepository: GoalRepository = {
  async getAllGoals() {
    const goals = await storage.getItem<unknown>(GOALS_KEY, []);
    return normalizeGoals(goals);
  },

  async getGoalById(id) {
    const goals = await this.getAllGoals();
    return goals.find((g) => g.id === id);
  },

  async saveGoals(goals) {
    await storage.setItem(GOALS_KEY, normalizeGoals(goals));
  },

  async addGoal(data) {
    await enforceCountLimitedFeatureGate('activeGoals', () => this.getActiveGoalCount(), {
      enabled: data.status === GoalStatus.ACTIVE,
    });

    const goals = await this.getAllGoals();
    const newGoal: Goal = {
      ...data,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    const normalizedGoal = requireValidGoal(newGoal, 'Goal data must be valid before saving.');
    await this.saveGoals([...goals, normalizedGoal]);
    return normalizedGoal;
  },

  async updateGoal(id, updates) {
    const goals = await this.getAllGoals();
    const idx = goals.findIndex((g) => g.id === id);
    if (idx === -1) return null;

    const existingGoal = goals[idx];
    const nextStatus = updates.status ?? existingGoal.status;
    const isBecomingActive =
      existingGoal.status !== GoalStatus.ACTIVE && nextStatus === GoalStatus.ACTIVE;

    await enforceCountLimitedFeatureGate('activeGoals', () => this.getActiveGoalCount(), {
      enabled: isBecomingActive,
    });

    goals[idx] = requireValidGoal(
      { ...goals[idx], ...updates },
      'Goal update would create invalid goal data.',
    );
    await this.saveGoals(goals);
    return goals[idx];
  },

  async deleteGoal(id) {
    const normalizedId = requireGoalId(id);
    const goals = await this.getAllGoals();
    await this.saveGoals(goals.filter((g) => g.id !== normalizedId));
  },

  async incrementGoalProgress(id, amount) {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      throw new Error('Goal progress increment amount must be a finite number.');
    }

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
