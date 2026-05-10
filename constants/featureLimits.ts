export const FREE_TIER_LIMITS = {
  BAD_HABITS: 2,
  ACTIVE_GOALS: 5,
  JOURNAL_ENTRIES: 60,
  HABIT_HISTORY_DAYS: 90,
  ACTIVITY_EDIT_WINDOW_HOURS: 48,
} as const;

const HOUR_IN_MS = 60 * 60 * 1000;

type CountLimitedFeatureConfig = {
  limit: number;
  featureName: string;
};

type PremiumFeatureConfig = {
  featureName: string;
};

const COUNT_LIMITED_FEATURES = {
  activeGoals: {
    limit: FREE_TIER_LIMITS.ACTIVE_GOALS,
    featureName: 'more than 5 active goals',
  },
  journalEntries: {
    limit: FREE_TIER_LIMITS.JOURNAL_ENTRIES,
    featureName: 'unlimited journal entries',
  },
  badHabits: {
    limit: FREE_TIER_LIMITS.BAD_HABITS,
    featureName: 'more than 2 private recovery trackers',
  },
} as const satisfies Record<string, CountLimitedFeatureConfig>;

const PREMIUM_FEATURES = {
  habitHistory: {
    featureName: 'unlimited habit history',
  },
  focusSessions: {
    featureName: 'focus sessions',
  },
  appBlocking: {
    featureName: 'blocked-app planning',
  },
  focusAndBlocking: {
    featureName: 'focus sessions and blocked-app planning',
  },
} as const satisfies Record<string, PremiumFeatureConfig>;

export type CountLimitedFeatureKey = keyof typeof COUNT_LIMITED_FEATURES;
export type PremiumFeatureKey = keyof typeof PREMIUM_FEATURES;

export type CountLimitedFeatureGate = {
  key: CountLimitedFeatureKey;
  limit: number;
  count: number;
  remaining: number;
  locked: boolean;
  featureName: string;
};

export type PremiumFeatureGate = {
  key: PremiumFeatureKey;
  locked: boolean;
  featureName: string;
};

export function getHabitHistoryCutoffDate(now: Date = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (FREE_TIER_LIMITS.HABIT_HISTORY_DAYS - 1));
  return cutoff;
}

export function filterHabitHistoryCompletions<T extends { completedDate: string }>(
  completions: T[],
  isPremium: boolean,
  now: Date = new Date(),
): T[] {
  if (isPremium === true) return completions;

  const cutoff = formatDateOnly(getHabitHistoryCutoffDate(now));
  return completions.filter((completion) => completion.completedDate >= cutoff);
}

export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMaxDateString(a: string, b: string): string {
  return a >= b ? a : b;
}

export function getCountLimitedFeatureGate(
  key: CountLimitedFeatureKey,
  isPremium: boolean,
  count: number,
): CountLimitedFeatureGate {
  const config = COUNT_LIMITED_FEATURES[key];
  const premium = isPremium === true;
  const normalizedCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  const remaining = Math.max(0, config.limit - normalizedCount);

  return {
    key,
    limit: config.limit,
    count: normalizedCount,
    remaining,
    locked: !premium && normalizedCount >= config.limit,
    featureName: config.featureName,
  };
}

export function getPremiumFeatureGate(
  key: PremiumFeatureKey,
  isPremium: boolean,
  isRelevant: boolean = true,
): PremiumFeatureGate {
  const config = PREMIUM_FEATURES[key];
  const premium = isPremium === true;
  const relevant = isRelevant !== false;

  return {
    key,
    locked: !premium && relevant,
    featureName: config.featureName,
  };
}

function parseDateOrNull(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getActivityEditDeadline(loggedAt: string): Date | null {
  const loggedAtDate = parseDateOrNull(loggedAt);
  if (!loggedAtDate) return null;

  return new Date(
    loggedAtDate.getTime() + FREE_TIER_LIMITS.ACTIVITY_EDIT_WINDOW_HOURS * HOUR_IN_MS,
  );
}

export function canEditActivityLog(loggedAt: string, now: Date = new Date()): boolean {
  const deadline = getActivityEditDeadline(loggedAt);
  if (!deadline) return true;
  return now.getTime() <= deadline.getTime();
}

export function getActivityEditWindowRemainingMs(
  loggedAt: string,
  now: Date = new Date(),
): number {
  const deadline = getActivityEditDeadline(loggedAt);
  if (!deadline) return Number.POSITIVE_INFINITY;
  return deadline.getTime() - now.getTime();
}

export class ActivityEditWindowExpiredError extends Error {
  constructor() {
    super(
      `Activities can only be edited within ${FREE_TIER_LIMITS.ACTIVITY_EDIT_WINDOW_HOURS} hours of logging.`,
    );
    this.name = 'ActivityEditWindowExpiredError';
  }
}

export function isActivityEditWindowExpiredError(
  error: unknown,
): error is ActivityEditWindowExpiredError {
  return (
    error instanceof ActivityEditWindowExpiredError ||
    (error instanceof Error && error.name === 'ActivityEditWindowExpiredError')
  );
}
