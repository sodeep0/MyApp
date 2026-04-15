// Habit store — manages habits and completions
import type { Habit, HabitCompletion } from '../types/models';
import { getHabitRepository } from '@/repositories/factory';

function repo() {
  return getHabitRepository();
}

/**
 * Returns today's date as ISO "YYYY-MM-DD" in local timezone.
 */
export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
}

export async function addHabit(
  data: Omit<Habit, 'id' | 'createdAt' | 'isArchived' | 'streakShieldsRemaining'>,
): Promise<Habit[]> {
  return repo().addHabit(data);
}

export async function updateHabit(id: string, updates: Partial<Habit>): Promise<Habit | null> {
  return repo().updateHabit(id, updates);
}

export async function deleteHabit(id: string): Promise<void> {
  await repo().deleteHabit(id);
}

// ─── Completions ─────────────────────────────────────────────────────────────

export async function getCompletionsForHabit(habitId: string): Promise<HabitCompletion[]> {
  return repo().getCompletionsForHabit(habitId);
}

export async function getTodayCompletionsForHabit(habitId: string): Promise<HabitCompletion[]> {
  return repo().getTodayCompletionsForHabit(habitId);
}

export async function saveCompletions(completions: HabitCompletion[]): Promise<void> {
  await repo().saveCompletions(completions);
}

export async function markHabitComplete(habitId: string): Promise<HabitCompletion> {
  return repo().markHabitComplete(habitId);
}

export async function unmarkHabitComplete(habitId: string): Promise<void> {
  await repo().unmarkHabitComplete(habitId);
}

/**
 * Calculate current streak for a habit based on its frequency type.
 */
export function calculateStreak(
  completions: HabitCompletion[],
  frequency: string,
  weekDays?: number[],
  timesPerWeek?: number,
  everyNDays?: number,
): number {
  if (completions.length === 0) return 0;

  // Build a set of completed dates
  const dateSet = new Set(completions.map((c) => c.completedDate));

  // Sort completions by date descending
  const sortedDates = [...dateSet].sort().reverse();

  if (frequency === 'DAILY') {
    let streak = 0;
    const today = new Date();
    // Check from today backwards
    for (let i = 0; i < 1000; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      if (dateSet.has(dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  if (frequency === 'X_PER_WEEK' && timesPerWeek) {
    // Count completions in the current week
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as start
    let count = 0;
    completions.forEach((c) => {
      const d = new Date(c.completedDate);
      if (d >= startOfWeek && d <= today) {
        count++;
      }
    });
    return count;
  }

  if (frequency === 'EVERY_N_DAYS' && everyNDays) {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 1000; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i * everyNDays);
      const dateStr = formatDate(d);
      if (dateSet.has(dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  // Fallback: count consecutive days
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < sortedDates.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    if (sortedDates[i] === formatDate(expectedDate)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
