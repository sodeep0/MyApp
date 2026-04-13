// Universal storage wrapper — AsyncStorage on native, localStorage on web
import AsyncStorage from '@react-native-async-storage/async-storage';

async function getItem<T>(key: string, defaultValue: T | null = null): Promise<T | null> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    }
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    const raw = JSON.stringify(value);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, raw);
      return;
    }
    await AsyncStorage.setItem(key, raw);
  } catch (error) {
    console.warn(`Storage.setItem failed for key: ${key}`, error);
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`Storage.removeItem failed for key: ${key}`, error);
  }
}

// In-memory store for web fallback (also used by reactive hooks)
const listeners = new Map<string, Set<() => void>>();

function subscribe(key: string, listener: () => void): () => void {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key)!.add(listener);
  return () => {
    listeners.get(key)?.delete(listener);
  };
}

function notify(key: string): void {
  listeners.get(key)?.forEach((fn) => fn());
}

export const storage = {
  getItem,
  setItem: async <T>(key: string, value: T) => {
    await setItem(key, value);
    notify(key);
  },
  removeItem: async (key: string) => {
    await removeItem(key);
    notify(key);
  },
  subscribe,
};

export default storage;
