import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { storage } from '../asyncStorage';
import {
  formatMs,
  getActiveFocusSession,
  getAppLimit,
  getAppLimits,
  getBlockedApps,
  getLimitPercent,
  getScreenTimeExportState,
  isLimitReached,
  resetScreenTimeData,
  setAppLimit,
  setBlockedApp,
  startFocusSession,
} from '../../services/screenTimeState';

const SCREEN_TIME_APP_LIMITS_KEY = 'kaarma_screen_time_app_limits';
const BLOCKED_APPS_KEY = 'kaarma_screen_time_blocked_apps';
const FOCUS_SESSION_KEY = 'kaarma_screen_time_focus_session';

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

test('formatMs and limit helpers produce stable screen-time values', () => {
  assert.equal(formatMs(30 * 60 * 1000), '30m');
  assert.equal(formatMs(90 * 60 * 1000), '1h 30m');
  assert.equal(formatMs(Number.NaN), '0m');
  assert.equal(formatMs(-30 * 60 * 1000), '0m');
  assert.equal(isLimitReached(60, 60), true);
  assert.equal(isLimitReached(59, 60), false);
  assert.equal(isLimitReached(60, undefined), false);
  assert.equal(isLimitReached(Number.NaN, 60), false);
  assert.equal(isLimitReached(60, Number.NaN), false);
  assert.equal(getLimitPercent(30, 60), 0.5);
  assert.equal(getLimitPercent(90, 60), 1);
  assert.equal(getLimitPercent(90, undefined), 0);
  assert.equal(getLimitPercent(Number.NaN, 60), 0);
  assert.equal(getLimitPercent(60, Number.NaN), 0);
});

test('app limits can be set, read, and cleared', async () => {
  await setAppLimit('com.example.app', 45 * 60 * 1000);
  assert.equal(await getAppLimit('com.example.app'), 45 * 60 * 1000);
  assert.deepEqual(await getAppLimits(), {
    'com.example.app': 45 * 60 * 1000,
  });

  await setAppLimit('com.example.app', null);
  assert.equal(await getAppLimit('com.example.app'), undefined);
});

test('app limits treat invalid values as cleared limits', async () => {
  await setAppLimit('com.example.app', 45 * 60 * 1000);
  await setAppLimit('com.example.app', Number.NaN);
  assert.equal(await getAppLimit('com.example.app'), undefined);

  await setAppLimit('com.example.app', 45 * 60 * 1000);
  await setAppLimit('com.example.app', Number.POSITIVE_INFINITY);
  assert.equal(await getAppLimit('com.example.app'), undefined);

  await setAppLimit('com.example.app', 45 * 60 * 1000);
  await setAppLimit('com.example.app', 25 * 60 * 60 * 1000);
  assert.equal(await getAppLimit('com.example.app'), undefined);
});

test('app limits ignore corrupted persisted values on read and update', async () => {
  await storage.setItem(SCREEN_TIME_APP_LIMITS_KEY, {
    'com.valid.app': 10,
    '  com.trimmed.app  ': 15,
    '': 25,
    '   ': 30,
    'com.zero.app': 0,
    'com.nan.app': Number.NaN,
    'com.too-long.app': 25 * 60 * 60 * 1000,
    'com.text.app': '20',
  });

  assert.deepEqual(await getAppLimits(), {
    'com.valid.app': 10,
    'com.trimmed.app': 15,
  });

  await setAppLimit('  com.next.app  ', 20);
  await setAppLimit('   ', 40);
  assert.deepEqual(await getAppLimits(), {
    'com.valid.app': 10,
    'com.trimmed.app': 15,
    'com.next.app': 20,
  });
});

test('blocked app selections are persisted and removable', async () => {
  assert.deepEqual(await setBlockedApp('com.social.app', true), {
    'com.social.app': true,
  });
  assert.deepEqual(await getBlockedApps(), {
    'com.social.app': true,
  });

  assert.deepEqual(await setBlockedApp('com.social.app', false), {});
  assert.deepEqual(await getBlockedApps(), {});
});

test('blocked app selections ignore corrupted persisted values', async () => {
  await storage.setItem(BLOCKED_APPS_KEY, {
    'com.social.app': true,
    '  com.trimmed.app  ': true,
    '': true,
    '   ': true,
    'com.false.app': false,
    'com.text.app': 'true',
  });

  assert.deepEqual(await getBlockedApps(), {
    'com.social.app': true,
    'com.trimmed.app': true,
  });
});

test('blocked app writes ignore empty package names', async () => {
  assert.deepEqual(await setBlockedApp('   ', true), {});

  await setBlockedApp('  com.social.app  ', true);
  assert.deepEqual(await getBlockedApps(), {
    'com.social.app': true,
  });
});

test('focus sessions capture selected blocked apps and expire automatically', async () => {
  await setBlockedApp('com.social.app', true);
  await setBlockedApp('com.video.app', true);

  const session = await startFocusSession(25);

  assert.equal(session.durationMs, 25 * 60 * 1000);
  assert.deepEqual(session.blockedApps.sort(), ['com.social.app', 'com.video.app']);
  assert.deepEqual(await getActiveFocusSession(session.startedAt), session);
  assert.equal(await getActiveFocusSession(session.endsAt + 1), null);
});

test('focus sessions clear corrupted persisted sessions', async () => {
  await storage.setItem(FOCUS_SESSION_KEY, {
    startedAt: Date.now(),
    endsAt: Number.NaN,
    durationMs: 25 * 60 * 1000,
    blockedApps: ['com.social.app'],
  });

  assert.equal(await getActiveFocusSession(), null);
  assert.equal(await storage.getItem(FOCUS_SESSION_KEY, null), null);
});

test('focus sessions normalize persisted blocked app package names', async () => {
  const now = Date.now();
  await storage.setItem(FOCUS_SESSION_KEY, {
    startedAt: now,
    endsAt: now + 25 * 60 * 1000,
    durationMs: 25 * 60 * 1000,
    blockedApps: ['  com.social.app  ', '', '   ', 12],
  });

  assert.deepEqual(await getActiveFocusSession(now), {
    startedAt: now,
    endsAt: now + 25 * 60 * 1000,
    durationMs: 25 * 60 * 1000,
    blockedApps: ['com.social.app'],
  });
});

test('focus sessions reject invalid durations before persisting', async () => {
  await assert.rejects(
    startFocusSession(0),
    /Focus session duration must be between 1 minute and 24 hours/,
  );
  await assert.rejects(
    startFocusSession(Number.NaN),
    /Focus session duration must be between 1 minute and 24 hours/,
  );
  await assert.rejects(
    startFocusSession(24 * 60 + 1),
    /Focus session duration must be between 1 minute and 24 hours/,
  );

  assert.equal(await getActiveFocusSession(), null);
});

test('screen-time export state includes persisted local settings without expired sessions', async () => {
  await setAppLimit('com.example.app', 15 * 60 * 1000);
  await setBlockedApp('com.social.app', true);
  const session = await startFocusSession(5);

  assert.deepEqual(await getScreenTimeExportState(session.startedAt), {
    appLimits: {
      'com.example.app': 15 * 60 * 1000,
    },
    focusAppPlan: {
      'com.social.app': true,
    },
    activeFocusSession: session,
  });

  assert.deepEqual(await getScreenTimeExportState(session.endsAt + 1), {
    appLimits: {
      'com.example.app': 15 * 60 * 1000,
    },
    focusAppPlan: {
      'com.social.app': true,
    },
    activeFocusSession: null,
  });
});

test('resetScreenTimeData clears limits, blocked apps, and active sessions', async () => {
  await setAppLimit('com.example.app', 10);
  await setBlockedApp('com.social.app', true);
  await startFocusSession(5);

  await resetScreenTimeData();

  assert.equal(await getAppLimit('com.example.app'), undefined);
  assert.deepEqual(await getBlockedApps(), {});
  assert.equal(await getActiveFocusSession(), null);
});
