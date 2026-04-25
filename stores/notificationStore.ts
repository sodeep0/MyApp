import { storage } from '@/storage/asyncStorage';

const NOTIFICATION_SETTINGS_KEY = 'kaarma_notification_settings_v1';

export interface NotificationSettings {
  enabled: boolean;
  habitRemindersEnabled: boolean;
  streakAlertsEnabled: boolean;
  goalDeadlineEnabled: boolean;
  weeklyReviewEnabled: boolean;
  weeklyReviewTime: string;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  habitRemindersEnabled: true,
  streakAlertsEnabled: true,
  goalDeadlineEnabled: true,
  weeklyReviewEnabled: true,
  weeklyReviewTime: '18:30',
};

function normalizeTime(value: string | null | undefined): string {
  if (!value) return DEFAULT_NOTIFICATION_SETTINGS.weeklyReviewTime;

  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return DEFAULT_NOTIFICATION_SETTINGS.weeklyReviewTime;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return DEFAULT_NOTIFICATION_SETTINGS.weeklyReviewTime;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return DEFAULT_NOTIFICATION_SETTINGS.weeklyReviewTime;
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function normalizeSettings(
  raw: Partial<NotificationSettings> | null,
): NotificationSettings {
  if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;

  return {
    enabled:
      typeof raw.enabled === 'boolean'
        ? raw.enabled
        : DEFAULT_NOTIFICATION_SETTINGS.enabled,
    habitRemindersEnabled:
      typeof raw.habitRemindersEnabled === 'boolean'
        ? raw.habitRemindersEnabled
        : DEFAULT_NOTIFICATION_SETTINGS.habitRemindersEnabled,
    streakAlertsEnabled:
      typeof raw.streakAlertsEnabled === 'boolean'
        ? raw.streakAlertsEnabled
        : DEFAULT_NOTIFICATION_SETTINGS.streakAlertsEnabled,
    goalDeadlineEnabled:
      typeof raw.goalDeadlineEnabled === 'boolean'
        ? raw.goalDeadlineEnabled
        : DEFAULT_NOTIFICATION_SETTINGS.goalDeadlineEnabled,
    weeklyReviewEnabled:
      typeof raw.weeklyReviewEnabled === 'boolean'
        ? raw.weeklyReviewEnabled
        : DEFAULT_NOTIFICATION_SETTINGS.weeklyReviewEnabled,
    weeklyReviewTime: normalizeTime(raw.weeklyReviewTime),
  };
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const stored = await storage.getItem<NotificationSettings>(
    NOTIFICATION_SETTINGS_KEY,
    null,
  );
  return normalizeSettings(stored);
}

export async function saveNotificationSettings(
  nextSettings: NotificationSettings,
): Promise<NotificationSettings> {
  const normalized = normalizeSettings(nextSettings);
  await storage.setItem(NOTIFICATION_SETTINGS_KEY, normalized);
  return normalized;
}

export async function updateNotificationSettings(
  updates: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  const current = await getNotificationSettings();
  return saveNotificationSettings({
    ...current,
    ...updates,
  });
}
