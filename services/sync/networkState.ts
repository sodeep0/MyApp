import * as Network from 'expo-network';
import { AppState, AppStateStatus } from 'react-native';

const listeners = new Set<() => void>();
let appStateSub: { remove: () => void } | null = null;
let networkStateSub: { remove: () => void } | null = null;
let lastOffline = false;

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function isOfflineNetworkState(state: {
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
}): boolean {
  return state.isConnected === false || state.isInternetReachable === false;
}

async function hydrateNetworkState() {
  try {
    const state = await Network.getNetworkStateAsync();
    lastOffline = isOfflineNetworkState(state);
  } catch {
    lastOffline = false;
  }
}

export function subscribeSyncTriggers(listener: () => void): () => void {
  listeners.add(listener);

  if (!appStateSub) {
    appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        notifyListeners();
      }
    });
  }

  if (!networkStateSub) {
    void hydrateNetworkState();
    networkStateSub = Network.addNetworkStateListener((state) => {
      const isOffline = isOfflineNetworkState(state);
      const restoredConnection = lastOffline && !isOffline;
      lastOffline = isOffline;

      if (restoredConnection) {
        notifyListeners();
      }
    });
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      if (appStateSub) {
        appStateSub.remove();
        appStateSub = null;
      }

      if (networkStateSub) {
        networkStateSub.remove();
        networkStateSub = null;
      }
    }
  };
}
