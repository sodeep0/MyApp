// React hooks for accessing stores reactively
import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook that loads data once and provides a refresh function.
 * Use for lists and detail screens.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): { data: T | null; loading: boolean; error: Error | null; refresh: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

  return { data, loading, error, refresh };
}

/**
 * Hook to get the current display name reactively.
 */
export function useDisplayName(): [string, (name: string) => Promise<void>] {
  const [name, setName] = useState('User');

  useEffect(() => {
    import('../stores/userStore').then((m) => m.getDisplayName().then(setName));
  }, []);

  const updateName = async (newName: string) => {
    await import('../stores/userStore').then((m) => m.updateDisplayName(newName));
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
    import('../stores/userStore').then((m) => m.isOnboardingCompleted().then(setDone));
  }, []);

  const setCompleted = async (completed: boolean) => {
    await import('../stores/userStore').then((m) => m.setOnboardingCompleted(completed));
    setDone(completed);
  };

  return [done, setCompleted];
}
