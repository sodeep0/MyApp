import { useState, useEffect } from 'react';
import { storage } from '@/storage/asyncStorage';
import {
  PREMIUM_KEY,
  getStoredPremiumState,
  setStoredPremiumState,
} from '@/services/subscription';

// Mock subscription hook for premium gating
// In production, replace with RevenueCat SDK integration
export function useSubscription() {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const check = async () => {
      try {
        const stored = await getStoredPremiumState();
        if (isMounted) {
          setIsPremium(stored);
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void check();
    const unsubscribe = storage.subscribe(PREMIUM_KEY, () => {
      void check();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const purchaseMonthly = async () => {
    setIsPremium(true);
    try {
      await setStoredPremiumState(true);
    } catch {
      // ignore
    }
  };

  const restorePurchases = async () => {
    try {
      setIsPremium(await getStoredPremiumState());
    } catch {
      // ignore
    }
  };

  const cancelSubscription = async () => {
    setIsPremium(false);
    try {
      await setStoredPremiumState(false);
    } catch {
      // ignore
    }
  };

  return {
    isPremium,
    isLoading,
    purchaseMonthly,
    restorePurchases,
    cancelSubscription,
  };
}

export default useSubscription;
