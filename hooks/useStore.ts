// React hooks for accessing stores reactively
import { useState, useEffect, useCallback } from 'react';
import {
  DISPLAY_NAME_KEY,
  getDisplayName,
  isOnboardingCompleted,
  setOnboardingCompleted,
  updateDisplayName,
} from '@/stores/userStore';
import {
  invalidate as emitInvalidate,
  subscribe,
  type InvalidateDomain,
} from '@/stores/invalidate';
import { getAllHabits } from '@/stores/habitStore';
import { getAllGoals } from '@/stores/goalStore';
import { getAllActivities } from '@/stores/activityStore';
import { getAllJournalEntries } from '@/stores/journalStore';
import { getAllBadHabits } from '@/stores/badHabitStore';
import { storage } from '@/storage/asyncStorage';

export type { InvalidateDomain };

/**
 * Generic hook that loads data once and provides a refresh function.
 * Pass `domain` to re-fetch when that invalidate bus domain is emitted.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options?: { domain?: InvalidateDomain | '*' },
): { data: T | null; loading: boolean; error: Error | null; refresh: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const domain = options?.domain;

  const refresh = useCallback(() => {
    setLoading(true);
    fetcher()
      .then(setData)
      .catch((err) => {
        console.warn('useAsyncData error:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => setLoading(false));
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!domain) return;
    return subscribe(domain, refresh);
  }, [domain, refresh]);

  return { data, loading, error, refresh };
}

/** Re-export for screens that prefer calling invalidate via the hook module. */
export { emitInvalidate as invalidate, subscribe };

export function useHabitsData() {
  return useAsyncData(() => getAllHabits(), [], { domain: 'habits' });
}

export function useGoalsData() {
  return useAsyncData(() => getAllGoals(), [], { domain: 'goals' });
}

export function useActivitiesData() {
  return useAsyncData(() => getAllActivities(), [], { domain: 'activities' });
}

export function useJournalData() {
  return useAsyncData(() => getAllJournalEntries(), [], { domain: 'journal' });
}

export function useBadHabitsData() {
  return useAsyncData(() => getAllBadHabits(), [], { domain: 'badHabits' });
}

/**
 * Hook to get the current display name reactively.
 */
export function useDisplayName(): [string, (name: string) => Promise<void>] {
  const [name, setName] = useState('User');

  useEffect(() => {
    const loadName = () => {
      getDisplayName().then(setName);
    };

    loadName();
    const unsubscribeStorage = storage.subscribe(DISPLAY_NAME_KEY, loadName);
    const unsubscribeInvalidate = subscribe('profile', loadName);

    return () => {
      unsubscribeStorage();
      unsubscribeInvalidate();
    };
  }, []);

  const updateName = async (newName: string) => {
    await updateDisplayName(newName);
    setName(newName);
  };

  return [name, updateName];
}

/**
 * Hook to check if onboarding is completed.
 */
export function useOnboardingCompleted(): [boolean, (completed: boolean) => Promise<void>] {
  const [done, setDone] = useState(false);

  useEffect(() => {
    isOnboardingCompleted().then(setDone);
  }, []);

  const setCompleted = async (completed: boolean) => {
    await setOnboardingCompleted(completed);
    setDone(completed);
  };

  return [done, setCompleted];
}
