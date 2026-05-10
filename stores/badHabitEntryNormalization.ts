import type { BadHabit, UrgeEvent } from '../types/models';

export function normalizeBadHabits(value: unknown): BadHabit[] {
  if (!Array.isArray(value)) return [];

  return value.filter((habit): habit is BadHabit => (
    !!habit
    && typeof habit === 'object'
    && typeof (habit as Partial<BadHabit>).id === 'string'
    && typeof (habit as Partial<BadHabit>).quitDate === 'string'
  ));
}

export function normalizeUrgeEvents(value: unknown): UrgeEvent[] {
  if (!Array.isArray(value)) return [];

  return value.filter((event): event is UrgeEvent => (
    !!event
    && typeof event === 'object'
    && typeof (event as Partial<UrgeEvent>).id === 'string'
    && typeof (event as Partial<UrgeEvent>).badHabitId === 'string'
    && typeof (event as Partial<UrgeEvent>).loggedAt === 'string'
  ));
}
