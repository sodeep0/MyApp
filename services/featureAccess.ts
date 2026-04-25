import {
  getCountLimitedFeatureGate,
  type CountLimitedFeatureGate,
  type CountLimitedFeatureKey,
} from '@/constants/featureLimits';
import { getStoredPremiumState } from '@/services/subscription';

export class CountLimitedFeatureLockedError extends Error {
  readonly gate: CountLimitedFeatureGate;

  constructor(gate: CountLimitedFeatureGate) {
    super(`Premium is required to unlock ${gate.featureName}.`);
    this.name = 'CountLimitedFeatureLockedError';
    this.gate = gate;
  }
}

export function isCountLimitedFeatureLockedError(
  error: unknown,
): error is CountLimitedFeatureLockedError {
  return (
    error instanceof CountLimitedFeatureLockedError ||
    (error instanceof Error && error.name === 'CountLimitedFeatureLockedError')
  );
}

type EnforceCountLimitedFeatureGateOptions = {
  enabled?: boolean;
};

export async function enforceCountLimitedFeatureGate(
  key: CountLimitedFeatureKey,
  loadCount: () => Promise<number>,
  options: EnforceCountLimitedFeatureGateOptions = {},
): Promise<void> {
  const enabled = options.enabled ?? true;
  if (!enabled) return;

  const isPremium = await getStoredPremiumState();
  if (isPremium) return;

  const count = await loadCount();
  const gate = getCountLimitedFeatureGate(key, isPremium, count);
  if (gate.locked) {
    throw new CountLimitedFeatureLockedError(gate);
  }
}
