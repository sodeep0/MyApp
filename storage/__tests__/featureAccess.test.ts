import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import {
  CountLimitedFeatureLockedError,
  enforceCountLimitedFeatureGate,
  isCountLimitedFeatureLockedError,
} from '../../services/featureAccess';
import {
  PREMIUM_KEY,
  getStoredPremiumState,
  setStoredPremiumState,
} from '../../services/subscription';
import { storage } from '../asyncStorage';

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

test('enforceCountLimitedFeatureGate throws a typed error for free users at the limit', async () => {
  await setStoredPremiumState(false);

  await assert.rejects(
    enforceCountLimitedFeatureGate('badHabits', async () => 2),
    (error) => {
      assert.equal(error instanceof CountLimitedFeatureLockedError, true);
      assert.equal(isCountLimitedFeatureLockedError(error), true);
      assert.equal((error as CountLimitedFeatureLockedError).gate.key, 'badHabits');
      return true;
    },
  );
});

test('enforceCountLimitedFeatureGate allows premium users and disabled checks', async () => {
  await setStoredPremiumState(true);

  await assert.doesNotReject(enforceCountLimitedFeatureGate('badHabits', async () => 2));

  await setStoredPremiumState(false);
  await assert.doesNotReject(
    enforceCountLimitedFeatureGate('badHabits', async () => 2, { enabled: false }),
  );
});

test('enforceCountLimitedFeatureGate only disables checks for literal false', async () => {
  await setStoredPremiumState(false);

  await assert.rejects(
    enforceCountLimitedFeatureGate('badHabits', async () => 2, { enabled: 0 as any }),
    CountLimitedFeatureLockedError,
  );
  await assert.rejects(
    enforceCountLimitedFeatureGate('badHabits', async () => 2, { enabled: null as any }),
    CountLimitedFeatureLockedError,
  );
});

test('stored premium state fails closed for malformed persisted values', async () => {
  await storage.setItem(PREMIUM_KEY, 'true');

  assert.equal(await getStoredPremiumState(), false);

  await assert.rejects(
    enforceCountLimitedFeatureGate('badHabits', async () => 2),
    CountLimitedFeatureLockedError,
  );

  await setStoredPremiumState('true' as any);
  assert.equal(await getStoredPremiumState(), false);
});
