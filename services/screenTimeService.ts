// Screen Time Service — Android UsageStats API wrapper
// Only available on Android with a dev client. Other platforms return null/empty data.
// Uses conditional require to avoid bundling the native module on non-Android platforms.

import { Platform } from 'react-native';
import { storage } from '../storage/asyncStorage';

type UsageStats = {
  packageName: string;
  totalTimeInForeground: number;
  lastTimeStamp: number;
};

type AppInfo = {
  packageName: string;
  appName?: string;
};

type UsageEvent = {
  timeStamp: number;
  eventTypeName: string;
};

type NativeModule = {
  getUsageStats: (start: number, end: number) => Promise<UsageStats[]>;
  getAggregatedUsageStats: (start: number, end: number, interval: number) => Promise<UsageStats[]>;
  getUsageEvents: (start: number, end: number) => Promise<UsageEvent[]>;
  getInstalledApps: () => Promise<AppInfo[]>;
  hasUsageStatsPermission: () => Promise<boolean>;
  requestUsageStatsPermission: () => Promise<void>;
};

let _nativeModule: NativeModule | null | undefined = undefined;
let _nativeModuleChecked = false;

async function getNativeModule(): Promise<NativeModule | null> {
  if (Platform.OS !== 'android') return null;
  if (_nativeModuleChecked) return _nativeModule ?? null;
  _nativeModuleChecked = true;

  let rawMod: any = null;
  try {
    rawMod = require('expo-android-usagestats');
  } catch (e) {
    console.warn('expo-android-usagestats not available — screen time features disabled', e);
    _nativeModule = null;
    return null;
  }

  if (
    !rawMod ||
    typeof rawMod.getUsageStats !== 'function' ||
    typeof rawMod.hasUsageStatsPermission !== 'function'
  ) {
    _nativeModule = null;
    return null;
  }

  _nativeModule = rawMod as NativeModule;
  return _nativeModule;
}

const APP_LIMITS_KEY = 'kaarma_screen_time_app_limits';

export interface AppUsage {
  packageName: string;
  appName: string;
  totalTimeMs: number;
  lastTimeUsed: number;
  dailyLimitMs?: number;
}

export interface ScreenTimeReport {
  totalMs: number;
  apps: AppUsage[];
  hourBreakdown: number[];
}

export interface WeeklyReport {
  dailyTotals: { date: string; totalMs: number }[];
  weekTotalMs: number;
}

type AppCatalog = {
  appNameMap: Map<string, string>;
  launchablePackages: Set<string>;
};

type AggregateMode = 'sum' | 'max';

/** Format milliseconds to "Xh Ym" */
export function formatMs(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function dayStartTs(dayOffset: number = 0): number {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayEndTs(dayOffset: number = 0): number {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

async function buildAppCatalog(): Promise<AppCatalog> {
  const mod = await getNativeModule();
  if (!mod) {
    return {
      appNameMap: new Map(),
      launchablePackages: new Set(),
    };
  }

  const appNameMap = new Map<string, string>();
  const launchablePackages = new Set<string>();

  try {
    const apps = await mod.getInstalledApps();
    for (const app of apps as Array<AppInfo | string>) {
      if (typeof app === 'string') {
        const packageName = app;
        launchablePackages.add(packageName);
        const fallbackName = packageName.split('.').pop() || packageName;
        appNameMap.set(packageName, fallbackName);
        continue;
      }

      if (!app?.packageName) continue;
      const packageName = app.packageName;
      launchablePackages.add(packageName);
      appNameMap.set(
        packageName,
        app.appName?.trim() || packageName.split('.').pop() || packageName,
      );
    }
  } catch {
    // Ignore and fall back to unfiltered usage stats.
  }

  return { appNameMap, launchablePackages };
}

function shouldIncludePackage(
  packageName: string,
  launchablePackages: Set<string>,
): boolean {
  if (!packageName) return false;
  if (packageName === 'android') return false;
  if (launchablePackages.size === 0) return true;
  return launchablePackages.has(packageName);
}

function aggregateUsageStats(
  stats: UsageStats[],
  launchablePackages: Set<string>,
  mode: AggregateMode,
): UsageStats[] {
  const byPackage = new Map<string, UsageStats>();

  for (const stat of stats) {
    if (!stat || stat.totalTimeInForeground <= 0) continue;
    if (!shouldIncludePackage(stat.packageName, launchablePackages)) continue;

    const existing = byPackage.get(stat.packageName);
    if (!existing) {
      byPackage.set(stat.packageName, {
        packageName: stat.packageName,
        totalTimeInForeground: stat.totalTimeInForeground,
        lastTimeStamp: stat.lastTimeStamp,
      });
      continue;
    }

    existing.lastTimeStamp = Math.max(existing.lastTimeStamp || 0, stat.lastTimeStamp || 0);
    if (mode === 'sum') {
      existing.totalTimeInForeground += stat.totalTimeInForeground;
    } else {
      existing.totalTimeInForeground = Math.max(
        existing.totalTimeInForeground,
        stat.totalTimeInForeground,
      );
    }
  }

  return Array.from(byPackage.values()).sort(
    (a, b) => b.totalTimeInForeground - a.totalTimeInForeground,
  );
}

export async function hasScreenTimePermission(): Promise<boolean> {
  const mod = await getNativeModule();
  if (!mod) return false;
  try {
    return await mod.hasUsageStatsPermission();
  } catch {
    return false;
  }
}

export async function requestScreenTimePermission(): Promise<void> {
  const mod = await getNativeModule();
  if (!mod) return;
  try {
    await mod.requestUsageStatsPermission();
  } catch {
    // Permission dialog failed
  }
}

export async function getScreenTimeReport(
  period: 'today' | 'week' = 'today',
): Promise<ScreenTimeReport | null> {
  const mod = await getNativeModule();
  if (!mod) return null;

  try {
    const startTime = period === 'today' ? dayStartTs() : dayStartTs(-6);
    const endTime = period === 'today' ? dayEndTs() : dayEndTs();

    const rawStats: UsageStats[] = await mod.getUsageStats(startTime, endTime);
    const { appNameMap, launchablePackages } = await buildAppCatalog();
    const aggregateMode: AggregateMode = period === 'today' ? 'max' : 'sum';
    const aggregated = aggregateUsageStats(rawStats, launchablePackages, aggregateMode);

    const limits = await storage.getItem<Record<string, number>>(APP_LIMITS_KEY, {});

    const totalMs = aggregated.reduce(
      (sum: number, stat: UsageStats) => sum + stat.totalTimeInForeground,
      0,
    );

    const apps: AppUsage[] = aggregated.map((stat: UsageStats) => {
      const appName = appNameMap.get(stat.packageName) || stat.packageName.split('.').pop() || stat.packageName;
      return {
        packageName: stat.packageName,
        appName,
        totalTimeMs: stat.totalTimeInForeground,
        lastTimeUsed: stat.lastTimeStamp,
        dailyLimitMs: limits?.[stat.packageName],
      };
    }).slice(0, 20);

    const hourBreakdown = await getHourBreakdown(startTime, endTime);

    return { totalMs, apps, hourBreakdown };
  } catch (error) {
    console.warn('getScreenTimeReport failed:', error);
    return null;
  }
}

export async function getWeeklyReport(): Promise<WeeklyReport | null> {
  const mod = await getNativeModule();
  if (!mod) return null;

  try {
    const { launchablePackages } = await buildAppCatalog();
    const dailyTotals: { date: string; totalMs: number }[] = [];
    let weekTotalMs = 0;

    for (let i = 6; i >= 0; i--) {
      const start = dayStartTs(-i);
      const end = dayEndTs(-i);
      const stats: UsageStats[] = await mod.getUsageStats(start, end);
      const dayAggregated = aggregateUsageStats(stats, launchablePackages, 'max');
      const dayTotal = dayAggregated.reduce(
        (sum: number, s: UsageStats) => sum + s.totalTimeInForeground,
        0,
      );
      const date = new Date(start).toISOString().slice(0, 10);
      dailyTotals.push({ date, totalMs: dayTotal });
      weekTotalMs += dayTotal;
    }

    return { dailyTotals, weekTotalMs };
  } catch (error) {
    console.warn('getWeeklyReport failed:', error);
    return null;
  }
}

async function getHourBreakdown(startTime: number, endTime: number): Promise<number[]> {
  const mod = await getNativeModule();
  const hours = new Array(24).fill(0);
  if (!mod) return hours;

  try {
    const events = await mod.getUsageEvents(startTime, endTime);
    if (!events || events.length === 0) return hours;

    for (const event of events) {
      const hour = new Date(event.timeStamp).getHours();
      if (event.eventTypeName === 'MOVE_TO_FOREGROUND') {
        hours[hour] += 15 * 60 * 1000;
      }
    }
  } catch {
    // Fallback to zeros
  }

  return hours;
}

export async function getAppLimit(packageName: string): Promise<number | undefined> {
  const limits = await storage.getItem<Record<string, number>>(APP_LIMITS_KEY, {});
  return limits?.[packageName];
}

export async function setAppLimit(packageName: string, limitMs: number | null): Promise<void> {
  const limits = await storage.getItem<Record<string, number>>(APP_LIMITS_KEY, {}) || {};
  if (limitMs === null || limitMs <= 0) {
    delete limits[packageName];
  } else {
    limits[packageName] = limitMs;
  }
  await storage.setItem(APP_LIMITS_KEY, limits);
}

export function isLimitReached(usageMs: number, limitMs?: number): boolean {
  if (!limitMs || limitMs <= 0) return false;
  return usageMs >= limitMs;
}

export function getLimitPercent(usageMs: number, limitMs?: number): number {
  if (!limitMs || limitMs <= 0) return 0;
  return Math.min(usageMs / limitMs, 1);
}
