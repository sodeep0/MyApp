import type { Habit, HabitCompletion } from '../types/models';
import { filterHabitHistoryCompletions } from '@/constants/featureLimits';
import { getHabitRepository } from '@/repositories/factory';
import { syncManagedNotificationsAsync } from '@/services/notifications';
import { getStoredPremiumState } from '@/services/subscription';
import { invalidate } from '@/stores/invalidate';

export {
  addDays,
  calculateBestStreak,
  calculateStreak,
  dateToStr,
  isHabitAtRisk,
  strToDate,
  todayStr,
} from '@/stores/habitMetrics';

function repo() {
  return getHabitRepository();
}

async function syncNotificationsAfterHabitChange(): Promise<void> {
  try {
    await syncManagedNotificationsAsync();
  } catch (error) {
    console.warn('Failed to sync notifications after habit change', error);
  }
}

// ─── Habits ──────────────────────────────────────────────────────────────────

export async function getAllHabits(): Promise<Habit[]> {
  return repo().getAllHabits();
}

export async function getHabitById(id: string): Promise<Habit | undefined> {
  return repo().getHabitById(id);
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  await repo().saveHabits(habits);
  invalidate('habits');
}

export async function addHabit(
  data: Omit<Habit, 'id' | 'createdAt' | 'isArchived' | 'streakShieldsRemaining'>,
): Promise<Habit[]> {
  const habits = await repo().addHabit(data);
  invalidate('habits');
  await syncNotificationsAfterHabitChange();
  return habits;
}

export async function updateHabit(id: string, updates: Partial<Habit>): Promise<Habit | null> {
  const habit = await repo().updateHabit(id, updates);
  invalidate('habits');
  await syncNotificationsAfterHabitChange();
  return habit;
}

export async function deleteHabit(id: string): Promise<void> {
  await repo().deleteHabit(id);
  invalidate('habits');
  await syncNotificationsAfterHabitChange();
}

// ─── Completions ─────────────────────────────────────────────────────────────

export async function getCompletionsForHabit(habitId: string): Promise<HabitCompletion[]> {
  return repo().getCompletionsForHabit(habitId);
}

export async function getAllCompletions(): Promise<HabitCompletion[]> {
  return repo().getAllCompletions();
}

export async function getVisibleCompletionsForHabit(habitId: string): Promise<HabitCompletion[]> {
  const [completions, isPremium] = await Promise.all([
    repo().getCompletionsForHabit(habitId),
    getStoredPremiumState(),
  ]);

  return filterHabitHistoryCompletions(completions, isPremium);
}

export async function getTodayCompletionsForHabit(habitId: string): Promise<HabitCompletion[]> {
  return repo().getTodayCompletionsForHabit(habitId);
}

export async function saveCompletions(completions: HabitCompletion[]): Promise<void> {
  await repo().saveCompletions(completions);
  invalidate('habits');
}

export async function markHabitComplete(habitId: string): Promise<HabitCompletion> {
  const completion = await repo().markHabitComplete(habitId);
  invalidate('habits');
  await syncNotificationsAfterHabitChange();
  return completion;
}

export async function unmarkHabitComplete(habitId: string): Promise<void> {
  await repo().unmarkHabitComplete(habitId);
  invalidate('habits');
  await syncNotificationsAfterHabitChange();
}
