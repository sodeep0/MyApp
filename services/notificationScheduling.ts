import { GoalStatus, type Goal, type Habit, type HabitCompletion } from '@/types/models';

export const STREAK_ALERT_TIME = '20:30';
export const GOAL_NUDGE_TIME = '09:00';
export const DEFAULT_WEEKLY_REVIEW_TIME = '18:30';
export const WEEKLY_REVIEW_WEEKDAY = 1;
export const MANAGED_NOTIFICATION_PREFIX = 'kaarma';

export type ParsedReminderTime = {
  hour: number;
  minute: number;
};

export type GoalNudgeCandidate = {
  idSuffix: string;
  body: string;
  triggerDate: Date;
};

export type HabitReminderCandidate = {
  habit: Habit;
  reminderTime: string;
};

export type ManagedNotificationRecord = {
  identifier: string;
  content?: {
    data?: Record<string, unknown> | null;
  } | null;
};

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

export function parseTime(time: string): ParsedReminderTime | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
}

export function createDateWithTime(base: Date, time: string): Date {
  const parsed = parseTime(time) ?? parseTime('09:00')!;

  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    parsed.hour,
    parsed.minute,
    0,
    0,
  );
}

export function weeklyReviewTime(time: string): ParsedReminderTime {
  return parseTime(time) ?? parseTime(DEFAULT_WEEKLY_REVIEW_TIME)!;
}

export function isManagedNotificationRecord(
  request: ManagedNotificationRecord,
): boolean {
  if (
    request.identifier === MANAGED_NOTIFICATION_PREFIX ||
    request.identifier.startsWith(`${MANAGED_NOTIFICATION_PREFIX}:`)
  ) {
    return true;
  }

  return request.content?.data?.scope === MANAGED_NOTIFICATION_PREFIX;
}

export function routeForNotificationData(
  data: Record<string, unknown> | null | undefined,
): string | null {
  if (!data || data.scope !== MANAGED_NOTIFICATION_PREFIX) return null;

  if (data.type === 'habit-reminder' || data.type === 'streak-alert') {
    const habitId = nonEmptyString(data.habitId);
    return habitId ? `/habits/detail?id=${encodeURIComponent(habitId)}` : null;
  }

  if (data.type === 'goal-deadline') {
    const goalId = nonEmptyString(data.goalId);
    return goalId ? `/goals/detail?id=${encodeURIComponent(goalId)}` : null;
  }

  if (data.type === 'weekly-review') {
    return '/(tabs)?review=weekly';
  }

  return null;
}

export function dateToKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function parseGoalTargetDate(targetDate: string): Date | null {
  const dateOnlyMatch = targetDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);

    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return null;
    }

    return parsed;
  }

  const parsed = new Date(targetDate);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    0,
    0,
    0,
    0,
  );
}

export function hasCompletedToday(completions: HabitCompletion[], now: Date): boolean {
  const todayKey = dateToKey(now);
  return completions.some((completion) => completion.completedDate === todayKey);
}

export function habitReminderCandidates(habits: Habit[]): HabitReminderCandidate[] {
  return habits.flatMap((habit) => {
    if (habit.isArchived || !habit.reminderTime || !parseTime(habit.reminderTime)) {
      return [];
    }

    return [
      {
        habit,
        reminderTime: habit.reminderTime,
      },
    ];
  });
}

export function nextStreakAlertDate(
  completions: HabitCompletion[],
  now: Date,
): Date {
  const completedToday = hasCompletedToday(completions, now);
  const todayAlert = createDateWithTime(now, STREAK_ALERT_TIME);

  if (!completedToday && todayAlert.getTime() > now.getTime()) {
    return todayAlert;
  }

  return createDateWithTime(addDays(now, 1), STREAK_ALERT_TIME);
}

export function goalNudgeCandidates(goal: Goal): GoalNudgeCandidate[] {
  if (!goal.targetDate || goal.status !== GoalStatus.ACTIVE) {
    return [];
  }

  const dueDate = parseGoalTargetDate(goal.targetDate);
  if (!dueDate) {
    return [];
  }

  return [
    {
      idSuffix: 'week',
      body: `${goal.title} is due in one week.`,
      triggerDate: createDateWithTime(addDays(dueDate, -7), GOAL_NUDGE_TIME),
    },
    {
      idSuffix: 'day',
      body: `${goal.title} is due tomorrow.`,
      triggerDate: createDateWithTime(addDays(dueDate, -1), GOAL_NUDGE_TIME),
    },
    {
      idSuffix: 'today',
      body: `${goal.title} is due today. Make space for one more push.`,
      triggerDate: createDateWithTime(dueDate, GOAL_NUDGE_TIME),
    },
  ];
}
