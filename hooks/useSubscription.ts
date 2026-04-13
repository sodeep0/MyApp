import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREMIUM_KEY = 'kaarma_premium';

// Mock subscription hook for premium gating
// In production, replace with RevenueCat SDK integration
export function useSubscription() {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const stored = window.localStorage.getItem(PREMIUM_KEY);
          setIsPremium(stored === 'true');
        } else {
          const stored = await AsyncStorage.getItem(PREMIUM_KEY);
          setIsPremium(stored === 'true');
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    check();
  }, []);

  const purchaseMonthly = async () => {
    setIsPremium(true);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(PREMIUM_KEY, 'true');
      } else {
        await AsyncStorage.setItem(PREMIUM_KEY, 'true');
      }
    } catch {
      // ignore
    }
  };

  const restorePurchases = async () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(PREMIUM_KEY);
        setIsPremium(stored === 'true');
      } else {
        const stored = await AsyncStorage.getItem(PREMIUM_KEY);
        setIsPremium(stored === 'true');
      }
    } catch {
      // ignore
    }
  };

  const cancelSubscription = async () => {
    setIsPremium(false);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(PREMIUM_KEY, 'false');
      } else {
        await AsyncStorage.setItem(PREMIUM_KEY, 'false');
      }
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
