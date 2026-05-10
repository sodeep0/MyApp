import {
  HabitCategory,
  HabitFrequency,
  type Habit,
  type HabitCompletion,
} from '@/types/models';

function isHabitCategory(value: unknown): value is HabitCategory {
  return Object.values(HabitCategory).includes(value as HabitCategory);
}

function isHabitFrequency(value: unknown): value is HabitFrequency {
  return Object.values(HabitFrequency).includes(value as HabitFrequency);
}

function normalizeWeekDays(value: unknown): number[] {
  if (!Array.isArray(value)) return [];

  return value.filter((day): day is number => (
    Number.isInteger(day)
    && day >= 0
    && day <= 6
  ));
}

export function normalizeHabits(value: unknown): Habit[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((habit): habit is Habit => (
      !!habit
      && typeof habit === 'object'
      && typeof (habit as Partial<Habit>).id === 'string'
      && typeof (habit as Partial<Habit>).name === 'string'
      && typeof (habit as Partial<Habit>).emoji === 'string'
      && typeof (habit as Partial<Habit>).colorHex === 'string'
      && isHabitCategory((habit as Partial<Habit>).category)
      && isHabitFrequency((habit as Partial<Habit>).frequency)
      && Number.isFinite((habit as Partial<Habit>).timesPerWeek)
      && Number.isFinite((habit as Partial<Habit>).everyNDays)
      && typeof (habit as Partial<Habit>).createdAt === 'string'
      && typeof (habit as Partial<Habit>).isArchived === 'boolean'
      && Number.isFinite((habit as Partial<Habit>).streakShieldsRemaining)
    ))
    .map((habit) => ({
      ...habit,
      weekDays: normalizeWeekDays(habit.weekDays),
      reminderTime: typeof habit.reminderTime === 'string' ? habit.reminderTime : null,
    }));
}

export function normalizeHabitCompletions(value: unknown): HabitCompletion[] {
  if (!Array.isArray(value)) return [];

  return value.filter((completion): completion is HabitCompletion => (
    !!completion
    && typeof completion === 'object'
    && typeof (completion as Partial<HabitCompletion>).id === 'string'
    && typeof (completion as Partial<HabitCompletion>).habitId === 'string'
    && typeof (completion as Partial<HabitCompletion>).completedDate === 'string'
    && typeof (completion as Partial<HabitCompletion>).completedAt === 'string'
  ));
}
