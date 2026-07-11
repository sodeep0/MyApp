import type { Habit, HabitCompletion } from '../types/models';

export function todayStr(): string {
  return dateToStr(new Date());
}

export function dateToStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function strToDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const SUNDAY_JS = 0;
const MAX_STREAK_LOOKBACK = 365;

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === SUNDAY_JS ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getCompletionDateSet(completions: HabitCompletion[]): Set<string> {
  return new Set(completions.map((c) => c.completedDate));
}

function consecutiveDaysBackward(dateSet: Set<string>, startDate: Date): number {
  let streak = 0;
  let d = new Date(startDate);
  while (streak < MAX_STREAK_LOOKBACK) {
    if (dateSet.has(dateToStr(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function calculateStreak(
  completions: HabitCompletion[],
  frequency: string,
  weekDays?: number[],
  timesPerWeek?: number,
  everyNDays?: number,
): number {
  if (completions.length === 0) return 0;

  const dateSet = getCompletionDateSet(completions);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDateStr = dateToStr(today);
  const yesterday = addDays(today, -1);
  const yesterdayStr = dateToStr(yesterday);

  if (frequency === 'DAILY') {
    const startDay = dateSet.has(todayDateStr) ? today : yesterday;
    return consecutiveDaysBackward(dateSet, startDay);
  }

  if (frequency === 'WEEKLY') {
    const days = weekDays ?? [1, 2, 3, 4, 5];
    const currentMonday = getMondayOfWeek(today);

    for (let w = 0; w < 52; w++) {
      const weekMonday = addDays(currentMonday, -7 * w);
      const weekFriday = addDays(weekMonday, 6);
      const isCurrentWeek = weekMonday <= today && today <= weekFriday;

      let satisfied: boolean;
      if (isCurrentWeek) {
        satisfied = days.some((wd) => {
          const targetDate = addDays(weekMonday, wd - 1);
          return targetDate <= today && dateSet.has(dateToStr(targetDate));
        });
      } else {
        satisfied = days.some((wd) => {
          const targetDate = addDays(weekMonday, wd - 1);
          return dateSet.has(dateToStr(targetDate));
        });
      }

      if (!satisfied) {
        return w;
      }
    }
    return 52;
  }

  if (frequency === 'X_PER_WEEK' && timesPerWeek) {
    const target = Math.min(timesPerWeek, 7);
    let streakWeeks = 0;
    const currentMonday = getMondayOfWeek(today);

    for (let w = 0; w < 52; w++) {
      const weekMonday = addDays(currentMonday, -7 * w);
      const weekSunday = addDays(weekMonday, 6);
      let completedInWeek = 0;

      for (let d = 0; d < 7; d++) {
        const day = addDays(weekMonday, d);
        const isFuture = day > today;
        if (!isFuture && dateSet.has(dateToStr(day))) {
          completedInWeek++;
        }
      }

      if (completedInWeek >= target) {
        streakWeeks++;
      } else if (w === 0 && weekMonday <= today && today <= weekSunday) {
        break;
      } else {
        break;
      }
    }

    return streakWeeks;
  }

  if (frequency === 'EVERY_N_DAYS' && everyNDays) {
    const n = Math.max(1, everyNDays);
    const allDates = [...dateSet].sort();
    if (allDates.length === 0) return 0;

    const createdStr = allDates[0];
    const createdDate = strToDate(createdStr);
    const totalDaysSinceCreation = Math.floor((today.getTime() - createdDate.getTime()) / 86400000);
    const totalPeriods = Math.ceil(totalDaysSinceCreation / n) + 1;
    let consecutiveHits = 0;

    for (let p = 0; p < totalPeriods && p < MAX_STREAK_LOOKBACK; p++) {
      const periodStart = addDays(createdDate, p * n);
      const periodEnd = addDays(periodStart, n - 1);

      if (periodEnd < createdDate) continue;
      if (periodStart > today) break;

      const isCurrentPeriod = periodStart <= today && today <= periodEnd;
      const effectiveEnd = isCurrentPeriod ? today : periodEnd;

      let hasCompletion = false;
      for (let d = new Date(periodStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
        if (dateSet.has(dateToStr(d))) {
          hasCompletion = true;
          break;
        }
      }

      if (hasCompletion) {
        consecutiveHits++;
      } else {
        break;
      }
    }

    return consecutiveHits;
  }

  if (dateSet.has(todayDateStr)) return consecutiveDaysBackward(dateSet, today);
  if (dateSet.has(yesterdayStr)) return consecutiveDaysBackward(dateSet, yesterday);
  return 0;
}

export function calculateBestStreak(
  completions: HabitCompletion[],
  frequency: string,
  weekDays?: number[],
  timesPerWeek?: number,
  everyNDays?: number,
): number {
  if (completions.length === 0) return 0;
  const dateSet = getCompletionDateSet(completions);
  const sorted = [...dateSet].sort();

  if (frequency === 'DAILY' || !frequency) {
    let best = 1;
    let current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = strToDate(sorted[i - 1]);
      const curr = strToDate(sorted[i]);
      const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diff === 1) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 1;
      }
    }
    return best;
  }

  if (frequency === 'WEEKLY' && weekDays && weekDays.length > 0) {
    const sortedDates = sorted.map(strToDate).sort((a, b) => a.getTime() - b.getTime());
    if (sortedDates.length === 0) return 0;

    const firstDate = sortedDates[0];
    const lastDate = sortedDates[sortedDates.length - 1];
    const startMonday = getMondayOfWeek(firstDate);
    const endMonday = getMondayOfWeek(lastDate);

    let bestWeeks = 0;
    let currentWeeks = 0;
    let monday = new Date(startMonday);

    while (monday <= endMonday) {
      const weekSatisfied = weekDays.some((wd) => {
        const targetDate = addDays(monday, wd - 1);
        return dateSet.has(dateToStr(targetDate));
      });

      if (weekSatisfied) {
        currentWeeks++;
        bestWeeks = Math.max(bestWeeks, currentWeeks);
      } else {
        currentWeeks = 0;
      }
      monday = addDays(monday, 7);
    }
    return bestWeeks;
  }

  if (frequency === 'X_PER_WEEK' && timesPerWeek) {
    const target = Math.min(timesPerWeek, 7);
    const sortedDates = sorted.map(strToDate).sort((a, b) => a.getTime() - b.getTime());
    if (sortedDates.length === 0) return 0;

    const firstMonday = getMondayOfWeek(sortedDates[0]);
    const lastMonday = getMondayOfWeek(sortedDates[sortedDates.length - 1]);

    let bestWeeks = 0;
    let currentWeeks = 0;
    let monday = new Date(firstMonday);

    while (monday <= addDays(lastMonday, 7)) {
      let completedInWeek = 0;
      for (let d = 0; d < 7; d++) {
        const day = addDays(monday, d);
        if (dateSet.has(dateToStr(day))) completedInWeek++;
      }

      if (completedInWeek >= target) {
        currentWeeks++;
        bestWeeks = Math.max(bestWeeks, currentWeeks);
      } else {
        currentWeeks = 0;
      }
      monday = addDays(monday, 7);
    }
    return bestWeeks;
  }

  if (frequency === 'EVERY_N_DAYS' && everyNDays) {
    const n = Math.max(1, everyNDays);
    const sortedDates = sorted.map(strToDate).sort((a, b) => a.getTime() - b.getTime());
    if (sortedDates.length === 0) return 0;

    const firstDate = sortedDates[0];
    const lastDate = sortedDates[sortedDates.length - 1];
    const totalDays = Math.floor((lastDate.getTime() - firstDate.getTime()) / 86400000);
    const totalPeriods = Math.ceil(totalDays / n) + 2;
    let best = 0;
    let current = 0;

    for (let p = 0; p < totalPeriods; p++) {
      const periodStart = addDays(firstDate, p * n);
      const periodEnd = addDays(periodStart, n - 1);

      let hasCompletion = false;
      for (let d = new Date(periodStart); d <= periodEnd; d.setDate(d.getDate() + 1)) {
        if (dateSet.has(dateToStr(d))) {
          hasCompletion = true;
          break;
        }
      }

      if (hasCompletion) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
    return best;
  }

  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = strToDate(sorted[i - 1]);
    const curr = strToDate(sorted[i]);
    if (Math.round((curr.getTime() - prev.getTime()) / 86400000) === 1) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}

export function isHabitAtRisk(
  habit: Habit,
  completions: HabitCompletion[],
): boolean {
  void habit;
  const today = new Date();
  const hour = today.getHours();
  if (hour < 22) return false;

  const dateSet = getCompletionDateSet(completions);
  const todayDateStr = dateToStr(today);
  if (dateSet.has(todayDateStr)) return false;

  return true;
}
