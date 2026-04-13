import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Universal localStorage/AsyncStorage hook
// Uses localStorage on web, AsyncStorage on mobile
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadValue = async () => {
      try {
        let raw: string | null = null;
        if (typeof window !== 'undefined' && window.localStorage) {
          raw = window.localStorage.getItem(key);
        } else {
          raw = await AsyncStorage.getItem(key);
        }
        if (raw !== null) {
          setStoredValue(JSON.parse(raw));
        }
      } catch {
        // Fall back to initial value
      }
      setIsInitialized(true);
    };
    loadValue();
  }, [key]);

  const setValue = useCallback(async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      const raw = JSON.stringify(valueToStore);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, raw);
      } else {
        await AsyncStorage.setItem(key, raw);
      }
    } catch (error) {
      console.warn(`useLocalStorage: Failed to set ${key}`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue, isInitialized] as const;
}

export default useLocalStorage;
