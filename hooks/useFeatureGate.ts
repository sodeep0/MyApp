import { useCallback, useEffect, useState } from 'react';
import {
  getCountLimitedFeatureGate,
  getPremiumFeatureGate,
  type CountLimitedFeatureKey,
  type PremiumFeatureKey,
} from '@/constants/featureLimits';
import { useSubscription } from '@/hooks/useSubscription';

type UseCountLimitedFeatureGateOptions = {
  enabled?: boolean;
};

export function useCountLimitedFeatureGate(
  key: CountLimitedFeatureKey,
  loadCount: () => Promise<number>,
  options: UseCountLimitedFeatureGateOptions = {},
) {
  const { isPremium } = useSubscription();
  const enabled = options.enabled ?? true;
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(enabled && !isPremium);

  const refresh = useCallback(async () => {
    if (!enabled || isPremium) {
      setCount(0);
      setLoading(false);
      return 0;
    }

    setLoading(true);
    try {
      const nextCount = await loadCount();
      setCount(nextCount);
      return nextCount;
    } finally {
      setLoading(false);
    }
  }, [enabled, isPremium, loadCount]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...getCountLimitedFeatureGate(key, isPremium, count),
    isPremium,
    count,
    loading,
    refresh,
  };
}

export function usePremiumFeatureGate(
  key: PremiumFeatureKey,
  isRelevant: boolean = true,
) {
  const { isPremium } = useSubscription();

  return {
    ...getPremiumFeatureGate(key, isPremium, isRelevant),
    isPremium,
  };
}
