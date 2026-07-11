import {
  BadHabitCategory,
  BadHabitSeverity,
  UrgeEventType,
  type BadHabit,
  type UrgeEvent,
} from '../types/models';

export const BAD_HABIT_NAME_MAX_LENGTH = 120;
export const BAD_HABIT_NOTES_MAX_LENGTH = 5_000;
export const URGE_NOTE_MAX_LENGTH = 2_000;
export const URGE_TRIGGER_TAG_MAX_LENGTH = 40;

const ISO_LIKE_DATE = /^\d{4}-\d{2}-\d{2}/;

function isBadHabitCategory(value: unknown): value is BadHabitCategory {
  return Object.values(BadHabitCategory).includes(value as BadHabitCategory);
}

function isBadHabitSeverity(value: unknown): value is BadHabitSeverity {
  return Object.values(BadHabitSeverity).includes(value as BadHabitSeverity);
}

function isUrgeEventType(value: unknown): value is UrgeEventType {
  return Object.values(UrgeEventType).includes(value as UrgeEventType);
}

function clampString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  return value.slice(0, maxLength);
}

/** Normalize a single bad habit; returns null when required fields are invalid. */
export function normalizeBadHabit(value: unknown): BadHabit | null {
  if (!value || typeof value !== 'object') return null;

  const habit = value as Partial<BadHabit>;
  if (typeof habit.id !== 'string' || habit.id.trim().length === 0) return null;
  if (typeof habit.quitDate !== 'string' || !ISO_LIKE_DATE.test(habit.quitDate)) return null;

  const name = clampString(habit.name, BAD_HABIT_NAME_MAX_LENGTH);
  if (!name || name.trim().length === 0) return null;
  if (!isBadHabitCategory(habit.category)) return null;
  if (!isBadHabitSeverity(habit.severity)) return null;

  const notes = habit.notes == null
    ? null
    : clampString(habit.notes, BAD_HABIT_NOTES_MAX_LENGTH);

  const createdAt = typeof habit.createdAt === 'string' ? habit.createdAt : habit.quitDate;
  const userId = typeof habit.userId === 'string' && habit.userId.trim()
    ? habit.userId
    : 'local';

  return {
    id: habit.id.trim(),
    userId,
    name: name.trim(),
    category: habit.category,
    severity: habit.severity,
    quitDate: habit.quitDate,
    notes,
    createdAt,
  };
}

export function normalizeBadHabits(value: unknown): BadHabit[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((habit) => normalizeBadHabit(habit))
    .filter((habit): habit is BadHabit => habit !== null);
}

/** Normalize a single urge event; returns null when required fields are invalid. */
export function normalizeUrgeEvent(value: unknown): UrgeEvent | null {
  if (!value || typeof value !== 'object') return null;

  const event = value as Partial<UrgeEvent>;
  if (typeof event.id !== 'string' || event.id.trim().length === 0) return null;
  if (typeof event.badHabitId !== 'string' || event.badHabitId.trim().length === 0) return null;
  if (typeof event.loggedAt !== 'string' || event.loggedAt.trim().length === 0) return null;
  if (!isUrgeEventType(event.type)) return null;

  const note = event.note == null ? null : clampString(event.note, URGE_NOTE_MAX_LENGTH);
  const triggerTag = event.triggerTag == null
    ? null
    : clampString(event.triggerTag, URGE_TRIGGER_TAG_MAX_LENGTH);

  return {
    id: event.id.trim(),
    badHabitId: event.badHabitId.trim(),
    type: event.type,
    note,
    triggerTag: triggerTag && triggerTag.trim().length > 0 ? triggerTag.trim() : null,
    resetCounter: event.resetCounter === true,
    loggedAt: event.loggedAt,
  };
}

export function normalizeUrgeEvents(value: unknown): UrgeEvent[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((event) => normalizeUrgeEvent(event))
    .filter((event): event is UrgeEvent => event !== null);
}
