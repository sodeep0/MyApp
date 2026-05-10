import { GoalStatus, type Goal, type Milestone } from '@/types/models';

function isGoalStatus(value: unknown): value is GoalStatus {
  return value === GoalStatus.ACTIVE
    || value === GoalStatus.COMPLETED
    || value === GoalStatus.ABANDONED;
}

function normalizeMilestones(value: unknown): Milestone[] {
  if (!Array.isArray(value)) return [];

  return value.filter((milestone): milestone is Milestone => (
    !!milestone
    && typeof milestone === 'object'
    && typeof (milestone as Partial<Milestone>).id === 'string'
    && typeof (milestone as Partial<Milestone>).title === 'string'
    && typeof (milestone as Partial<Milestone>).isCompleted === 'boolean'
    && (
      (milestone as Partial<Milestone>).completedAt === null
      || typeof (milestone as Partial<Milestone>).completedAt === 'string'
    )
  ));
}

export function normalizeGoals(value: unknown): Goal[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((goal): goal is Goal => (
      !!goal
      && typeof goal === 'object'
      && typeof (goal as Partial<Goal>).id === 'string'
      && typeof (goal as Partial<Goal>).title === 'string'
      && isGoalStatus((goal as Partial<Goal>).status)
      && Number.isFinite((goal as Partial<Goal>).currentValue)
      && (
        (goal as Partial<Goal>).targetValue === null
        || Number.isFinite((goal as Partial<Goal>).targetValue)
      )
    ))
    .map((goal) => ({
      ...goal,
      milestones: normalizeMilestones(goal.milestones),
    }));
}
