import { AppState, AppStateStatus } from 'react-native';

const listeners = new Set<() => void>();
let appStateSub: { remove: () => void } | null = null;

export function subscribeSyncTriggers(listener: () => void): () => void {
  listeners.add(listener);

  if (!appStateSub) {
    appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        listeners.forEach((fn) => fn());
      }
    });
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && appStateSub) {
      appStateSub.remove();
      appStateSub = null;
    }
  };
}
