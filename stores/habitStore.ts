// Habit store — manages habits and completions
import type { Habit, HabitCompletion } from '../types/models';
import { generateUUID } from './baseStore';

const HABITS_KEY = 'kaarma_habits';
const COMPLETIONS_KEY = 'kaarma_habit_completions';

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
  const { storage } = await import('../storage/asyncStorage');
  return (await storage.getItem<Habit[]>(HABITS_KEY)) ?? [];
}

export async function getHabitById(id: string): Promise<Habit | undefined> {
  const habits = await getAllHabits();
  return habits.find((h) => h.id === id);
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  const { storage } = await import('../storage/asyncStorage');
  await storage.setItem(HABITS_KEY, habits);
}

export async function addHabit(
  data: Omit<Habit, 'id' | 'createdAt' | 'isArchived' | 'streakShieldsRemaining'>,
): Promise<Habit[]> {
  const habits = await getAllHabits();
  const newHabit: Habit = {
    ...data,
    id: generateUUID(),
    createdAt: new Date().toISOString(),
    isArchived: false,
    streakShieldsRemaining: 0,
  };
  await saveHabits([...habits, newHabit]);
  return habits; // return the full list after add
}

export async function updateHabit(id: string, updates: Partial<Habit>): Promise<Habit | null> {
  const habits = await getAllHabits();
  const idx = habits.findIndex((h) => h.id === id);
  if (idx === -1) return null;
  habits[idx] = { ...habits[idx], ...updates };
  await saveHabits(habits);
  return habits[idx];
}

export async function deleteHabit(id: string): Promise<void> {
  const habits = await getAllHabits();
  await saveHabits(habits.filter((h) => h.id !== id));
  // Also delete completions for this habit
  const completions = await getCompletionsForHabit(id);
  await saveCompletions(completions.filter((c) => c.habitId !== id));
}

// ─── Completions ─────────────────────────────────────────────────────────────

export async function getCompletionsForHabit(habitId: string): Promise<HabitCompletion[]> {
  const { storage } = await import('../storage/asyncStorage');
  const all = (await storage.getItem<HabitCompletion[]>(COMPLETIONS_KEY)) ?? [];
  return all.filter((c) => c.habitId === habitId);
}

export async function getTodayCompletionsForHabit(habitId: string): Promise<HabitCompletion[]> {
  const completions = await getCompletionsForHabit(habitId);
  const today = todayStr();
  return completions.filter((c) => c.completedDate === today);
}

export async function saveCompletions(completions: HabitCompletion[]): Promise<void> {
  const { storage } = await import('../storage/asyncStorage');
  await storage.setItem(COMPLETIONS_KEY, completions);
}

export async function markHabitComplete(habitId: string): Promise<HabitCompletion> {
  const { storage } = await import('../storage/asyncStorage');
  const all = (await storage.getItem<HabitCompletion[]>(COMPLETIONS_KEY)) ?? [];
  const today = todayStr();

  // Don't double-complete
  const exists = all.find((c) => c.habitId === habitId && c.completedDate === today);
  if (exists) return exists;

  const completion: HabitCompletion = {
    id: generateUUID(),
    habitId,
    completedDate: today,
    completedAt: new Date().toISOString(),
  };
  await storage.setItem(COMPLETIONS_KEY, [...all, completion]);
  return completion;
}

export async function unmarkHabitComplete(habitId: string): Promise<void> {
  const { storage } = await import('../storage/asyncStorage');
  const all = (await storage.getItem<HabitCompletion[]>(COMPLETIONS_KEY)) ?? [];
  const today = todayStr();
  await storage.setItem(
    COMPLETIONS_KEY,
    all.filter((c) => !(c.habitId === habitId && c.completedDate === today)),
  );
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
