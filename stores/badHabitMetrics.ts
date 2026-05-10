import type { UrgeEvent } from '@/types/models';

const DAY_IN_MS = 86400000;

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(start: Date, end: Date): number {
  return Math.floor((startOfLocalDay(end).getTime() - startOfLocalDay(start).getTime()) / DAY_IN_MS);
}

function relapseResetDays(urgeEvents: UrgeEvent[], now: Date): Date[] {
  const today = startOfLocalDay(now).getTime();

  return urgeEvents
    .filter((event) => event.type === 'RELAPSE' && event.resetCounter)
    .map((event) => startOfLocalDay(new Date(event.loggedAt)))
    .filter((date) => !Number.isNaN(date.getTime()))
    .filter((date) => date.getTime() <= today)
    .sort((a, b) => a.getTime() - b.getTime())
    .filter((date, index, dates) => index === 0 || date.getTime() !== dates[index - 1].getTime());
}

export function daysSinceQuit(quitDateStr: string, now: Date = new Date()): number {
  const quitDate = new Date(quitDateStr);
  if (Number.isNaN(quitDate.getTime())) return 0;
  return Math.max(0, daysBetween(quitDate, now));
}

export function currentStreakDays(
  quitDateStr: string,
  urgeEvents: UrgeEvent[],
  now: Date = new Date(),
): number {
  const resetDates = relapseResetDays(urgeEvents, now);
  if (resetDates.length === 0) return daysSinceQuit(quitDateStr, now);

  const lastReset = resetDates[resetDates.length - 1];
  return Math.max(0, daysBetween(lastReset, now));
}

export function bestStreakDays(
  quitDateStr: string,
  urgeEvents: UrgeEvent[],
  now: Date = new Date(),
): number {
  const quitDate = new Date(quitDateStr);
  if (Number.isNaN(quitDate.getTime())) return 0;

  const resetDates = relapseResetDays(urgeEvents, now);
  if (resetDates.length === 0) {
    return daysSinceQuit(quitDateStr, now);
  }

  let best = 0;
  let start = startOfLocalDay(quitDate);

  for (const reset of resetDates) {
    best = Math.max(best, daysBetween(start, reset));
    start = reset;
  }

  return Math.max(best, daysBetween(start, now));
}

export function totalCleanDays(
  quitDateStr: string,
  urgeEvents: UrgeEvent[],
  now: Date = new Date(),
): number {
  const totalDays = daysSinceQuit(quitDateStr, now);
  const relapseDays = relapseResetDays(urgeEvents, now).length;
  return Math.max(0, totalDays - relapseDays);
}
