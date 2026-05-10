import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettings,
  saveNotificationSettings,
  updateNotificationSettings,
} from '../../stores/notificationStore';
import {
  DEFAULT_SECURITY_SETTINGS,
  getSecuritySettings,
  isJournalLockEnabled,
  saveSecuritySettings,
  updateSecuritySettings,
} from '../../stores/securityStore';

function installLocalStorage(): void {
  const values = new Map<string, string>();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => {
          values.set(key, value);
        },
        removeItem: (key: string) => {
          values.delete(key);
        },
      },
    },
  });
}

beforeEach(() => {
  installLocalStorage();
});

test('notification settings fall back to safe defaults when missing', async () => {
  assert.deepEqual(await getNotificationSettings(), DEFAULT_NOTIFICATION_SETTINGS);
});

test('notification settings normalize invalid weekly review times', async () => {
  const saved = await saveNotificationSettings({
    enabled: true,
    habitRemindersEnabled: true,
    streakAlertsEnabled: true,
    goalDeadlineEnabled: true,
    weeklyReviewEnabled: true,
    weeklyReviewTime: '25:99',
  });

  assert.equal(saved.weeklyReviewTime, DEFAULT_NOTIFICATION_SETTINGS.weeklyReviewTime);
});

test('notification settings preserve valid partial updates', async () => {
  await saveNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
  const updated = await updateNotificationSettings({
    enabled: true,
    weeklyReviewTime: '7:05',
  });

  assert.equal(updated.enabled, true);
  assert.equal(updated.weeklyReviewTime, '07:05');
  assert.equal(updated.habitRemindersEnabled, DEFAULT_NOTIFICATION_SETTINGS.habitRemindersEnabled);
});

test('security settings fall back to safe defaults when missing', async () => {
  assert.deepEqual(await getSecuritySettings(), DEFAULT_SECURITY_SETTINGS);
  assert.equal(await isJournalLockEnabled(), DEFAULT_SECURITY_SETTINGS.journalLockEnabled);
});

test('security settings normalize unlock timeout and preserve boolean controls', async () => {
  const saved = await saveSecuritySettings({
    journalLockEnabled: true,
    journalUnlockTimeoutMinutes: 90,
    relockOnBackground: false,
  });

  assert.equal(saved.journalLockEnabled, true);
  assert.equal(saved.journalUnlockTimeoutMinutes, DEFAULT_SECURITY_SETTINGS.journalUnlockTimeoutMinutes);
  assert.equal(saved.relockOnBackground, false);
});

test('security settings do not coerce malformed journal lock values to enabled', async () => {
  const saved = await saveSecuritySettings({
    journalLockEnabled: 'false' as any,
    journalUnlockTimeoutMinutes: 5,
    relockOnBackground: true,
  });

  assert.equal(saved.journalLockEnabled, DEFAULT_SECURITY_SETTINGS.journalLockEnabled);
  assert.equal(await isJournalLockEnabled(), DEFAULT_SECURITY_SETTINGS.journalLockEnabled);
});

test('security settings round valid timeout values and merge partial updates', async () => {
  await saveSecuritySettings(DEFAULT_SECURITY_SETTINGS);
  const updated = await updateSecuritySettings({
    journalLockEnabled: true,
    journalUnlockTimeoutMinutes: 12.6,
  });

  assert.equal(updated.journalLockEnabled, true);
  assert.equal(updated.journalUnlockTimeoutMinutes, 13);
  assert.equal(updated.relockOnBackground, DEFAULT_SECURITY_SETTINGS.relockOnBackground);
});
