import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const projectRoot = join(__dirname, '..', '..');

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

test('logout cleanup clears only cloud-backed local caches and scoped sync queue entries', () => {
  const source = readProjectFile('services/firebase/auth.ts');

  assert.match(source, /clearHabitLocalCache/);
  assert.match(source, /clearGoalLocalCache/);
  assert.match(source, /clearActivityLocalCache/);
  assert.match(source, /clearUserLocalSessionData/);
  assert.match(source, /clearSyncQueue\(\["user", "habits", "goals", "activities"\]\)/);
  assert.doesNotMatch(source, /resetSensitiveDataStorage/);
  assert.doesNotMatch(source, /clearSyncQueue\(\["journal"/);
  assert.doesNotMatch(source, /clearSyncQueue\(\["badHabits"/);
});

test('logout cleanup observes all session cleanup failures before rejecting', () => {
  const source = readProjectFile('services/firebase/auth.ts');

  assert.match(source, /Promise\.allSettled/);
  assert.match(source, /Sign-out cleanup failed for/);
  assert.match(source, /getSessionCleanupErrorMessage/);
});

test('signOutCurrentUser cleans local session data even when Firebase auth is unavailable', () => {
  const source = readProjectFile('services/firebase/auth.ts');

  assert.match(
    source,
    /if \(!auth\) {\s+await clearSignedInUserSessionData\(\);\s+return;\s+}/,
  );
});

test('notification sync cancels managed notifications when disabled or permission is unavailable', () => {
  const source = readProjectFile('services/notifications.ts');

  assert.match(
    source,
    /if \(!settings\.enabled \|\| !hasPermission\) {\s+await cancelManagedNotificationsAsync\(\);\s+return 0;\s+}/,
  );
});

test('disabling notifications persists disabled state and cancels managed schedules', () => {
  const source = readProjectFile('services/notifications.ts');

  assert.match(
    source,
    /export async function disableNotificationsAsync\(\): Promise<void> {\s+await updateNotificationSettings\({\s+enabled: false,\s+}\);\s+await cancelManagedNotificationsAsync\(\);\s+}/,
  );
});

test('managed notification cancellation is best-effort per notification', () => {
  const source = readProjectFile('services/notifications.ts');

  assert.match(source, /Promise\.allSettled/);
  assert.match(source, /Failed to cancel notification/);
});

test('notification sync schedules individual notifications best-effort', () => {
  const source = readProjectFile('services/notifications.ts');

  assert.match(source, /scheduleNotificationBestEffortAsync/);
  assert.match(source, /Failed to schedule notification/);
  assert.match(source, /scheduled\.filter\(Boolean\)\.length/);
  assert.match(source, /Failed to prepare streak alert for habit/);
});

test('notification initialization registers managed response deep-link handling', () => {
  const source = readProjectFile('services/notifications.ts');

  assert.match(source, /addNotificationResponseReceivedListener/);
  assert.match(source, /routeForNotificationData/);
  assert.match(source, /router\.push\(route as any\)/);
  assert.match(source, /notificationResponseSubscription/);
});
