import * as Network from 'expo-network';
import { AppState, AppStateStatus } from 'react-native';

const listeners = new Set<() => void>();
let appStateSub: { remove: () => void } | null = null;
let networkStateSub: { remove: () => void } | null = null;
/**
 * Unknown / failed hydrate must not assume online — start offline-safe so a
 * later online event can still fire reconnect sync.
 */
let lastOffline = true;

/** Shared offline predicate for sync triggers and OfflineBanner. */
export function isOfflineNetworkState(state: {
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
}): boolean {
  return state.isConnected === false || state.isInternetReachable === false;
}

export function getIsOffline(): boolean {
  return lastOffline;
}

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

async function hydrateNetworkState() {
  try {
    const state = await Network.getNetworkStateAsync();
    lastOffline = isOfflineNetworkState(state);
  } catch {
    // Do not assume online when hydrate fails.
    lastOffline = true;
  }
}

function ensureNetworkSubscription() {
  if (networkStateSub) return;

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

function ensureAppStateSubscription() {
  if (appStateSub) return;

  appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      notifyListeners();
    }
  });
}

export function subscribeSyncTriggers(listener: () => void): () => void {
  listeners.add(listener);
  ensureAppStateSubscription();
  ensureNetworkSubscription();

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
