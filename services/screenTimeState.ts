import { storage } from '@/storage/asyncStorage';

export const SCREEN_TIME_APP_LIMITS_KEY = 'kaarma_screen_time_app_limits';
const BLOCKED_APPS_KEY = 'kaarma_screen_time_blocked_apps';
const FOCUS_SESSION_KEY = 'kaarma_screen_time_focus_session';
const MAX_DAILY_APP_LIMIT_MS = 24 * 60 * 60 * 1000;
const MAX_FOCUS_SESSION_MINUTES = 24 * 60;

export interface FocusSession {
  startedAt: number;
  endsAt: number;
  durationMs: number;
  blockedApps: string[];
}

export interface ScreenTimeExportState {
  appLimits: Record<string, number>;
  focusAppPlan: Record<string, boolean>;
  activeFocusSession: FocusSession | null;
}

function positiveFiniteNumber(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function formatMs(ms: number): string {
  const totalMin = Math.round(positiveFiniteNumber(ms) / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizePackageName(packageName: unknown): string | null {
  if (typeof packageName !== 'string') return null;

  const normalized = packageName.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeAppLimits(value: unknown): Record<string, number> {
  if (!isPlainRecord(value)) return {};

  return Object.entries(value).reduce<Record<string, number>>((limits, [packageName, limitMs]) => {
    const normalizedPackageName = normalizePackageName(packageName);
    if (
      normalizedPackageName
      && typeof limitMs === 'number'
      && Number.isFinite(limitMs)
      && limitMs > 0
      && limitMs <= MAX_DAILY_APP_LIMIT_MS
    ) {
      limits[normalizedPackageName] = limitMs;
    }
    return limits;
  }, {});
}

function normalizeBlockedApps(value: unknown): Record<string, boolean> {
  if (!isPlainRecord(value)) return {};

  return Object.entries(value).reduce<Record<string, boolean>>((blockedApps, [packageName, blocked]) => {
    const normalizedPackageName = normalizePackageName(packageName);
    if (normalizedPackageName && blocked === true) {
      blockedApps[normalizedPackageName] = true;
    }
    return blockedApps;
  }, {});
}

function normalizeFocusSession(value: unknown): FocusSession | null {
  if (!isPlainRecord(value)) return null;

  const { startedAt, endsAt, durationMs, blockedApps } = value;
  if (
    typeof startedAt !== 'number'
    || typeof endsAt !== 'number'
    || typeof durationMs !== 'number'
    || !Number.isFinite(startedAt)
    || !Number.isFinite(endsAt)
    || !Number.isFinite(durationMs)
    || durationMs <= 0
    || endsAt <= startedAt
    || !Array.isArray(blockedApps)
  ) {
    return null;
  }

  return {
    startedAt,
    endsAt,
    durationMs,
    blockedApps: blockedApps.flatMap((packageName) => {
      const normalizedPackageName = normalizePackageName(packageName);
      return normalizedPackageName ? [normalizedPackageName] : [];
    }),
  };
}

export async function getAppLimit(packageName: string): Promise<number | undefined> {
  const normalizedPackageName = normalizePackageName(packageName);
  if (!normalizedPackageName) return undefined;

  const limits = await getAppLimits();
  return limits?.[normalizedPackageName];
}

export async function getAppLimits(): Promise<Record<string, number>> {
  const limits = await storage.getItem<unknown>(SCREEN_TIME_APP_LIMITS_KEY, {});
  return normalizeAppLimits(limits);
}

export async function setAppLimit(packageName: string, limitMs: number | null): Promise<void> {
  const normalizedPackageName = normalizePackageName(packageName);
  if (!normalizedPackageName) return;

  const limits = await getAppLimits();
  if (
    limitMs === null
    || !Number.isFinite(limitMs)
    || limitMs <= 0
    || limitMs > MAX_DAILY_APP_LIMIT_MS
  ) {
    delete limits[normalizedPackageName];
  } else {
    limits[normalizedPackageName] = limitMs;
  }
  await storage.setItem(SCREEN_TIME_APP_LIMITS_KEY, limits);
}

export async function getBlockedApps(): Promise<Record<string, boolean>> {
  const blockedApps = await storage.getItem<unknown>(BLOCKED_APPS_KEY, {});
  return normalizeBlockedApps(blockedApps);
}

export async function setBlockedApp(packageName: string, blocked: boolean): Promise<Record<string, boolean>> {
  const normalizedPackageName = normalizePackageName(packageName);
  const blockedApps = await getBlockedApps();
  if (!normalizedPackageName) {
    await storage.setItem(BLOCKED_APPS_KEY, blockedApps);
    return blockedApps;
  }

  if (blocked) {
    blockedApps[normalizedPackageName] = true;
  } else {
    delete blockedApps[normalizedPackageName];
  }
  await storage.setItem(BLOCKED_APPS_KEY, blockedApps);
  return blockedApps;
}

export async function getActiveFocusSession(now: number = Date.now()): Promise<FocusSession | null> {
  const session = normalizeFocusSession(await storage.getItem<unknown>(FOCUS_SESSION_KEY, null));
  if (!session || session.endsAt <= now) {
    await storage.removeItem(FOCUS_SESSION_KEY);
    return null;
  }
  return session;
}

export async function startFocusSession(durationMinutes: number): Promise<FocusSession> {
  if (
    !Number.isFinite(durationMinutes)
    || durationMinutes <= 0
    || durationMinutes > MAX_FOCUS_SESSION_MINUTES
  ) {
    throw new Error('Focus session duration must be between 1 minute and 24 hours.');
  }

  const startedAt = Date.now();
  const durationMs = durationMinutes * 60 * 1000;
  const blockedApps = await getBlockedApps();
  const session: FocusSession = {
    startedAt,
    endsAt: startedAt + durationMs,
    durationMs,
    blockedApps: Object.keys(blockedApps).filter((pkg) => blockedApps[pkg]),
  };
  await storage.setItem(FOCUS_SESSION_KEY, session);
  return session;
}

export async function endFocusSession(): Promise<void> {
  await storage.removeItem(FOCUS_SESSION_KEY);
}

export async function resetScreenTimeData(): Promise<void> {
  await Promise.all([
    storage.removeItem(SCREEN_TIME_APP_LIMITS_KEY),
    storage.removeItem(BLOCKED_APPS_KEY),
    storage.removeItem(FOCUS_SESSION_KEY),
  ]);
}

export async function getScreenTimeExportState(now: number = Date.now()): Promise<ScreenTimeExportState> {
  const [appLimits, focusAppPlan, activeFocusSession] = await Promise.all([
    getAppLimits(),
    getBlockedApps(),
    getActiveFocusSession(now),
  ]);

  return {
    appLimits,
    focusAppPlan,
    activeFocusSession,
  };
}

export function isLimitReached(usageMs: number, limitMs?: number): boolean {
  const normalizedLimit = positiveFiniteNumber(limitMs ?? 0);
  if (normalizedLimit === 0) return false;
  return positiveFiniteNumber(usageMs) >= normalizedLimit;
}

export function getLimitPercent(usageMs: number, limitMs?: number): number {
  const normalizedLimit = positiveFiniteNumber(limitMs ?? 0);
  if (normalizedLimit === 0) return 0;
  return Math.min(positiveFiniteNumber(usageMs) / normalizedLimit, 1);
}
