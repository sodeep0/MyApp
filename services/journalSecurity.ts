import * as LocalAuthentication from 'expo-local-authentication';
import { AppState, type AppStateStatus } from 'react-native';
import { getSecuritySettings } from '@/stores/securityStore';

export type JournalUnlockResult = 'granted' | 'not_required' | 'cancelled' | 'unavailable';

interface JournalLockCapability {
  available: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
}

let unlockExpiresAtMs = 0;
let lifecycleInitialized = false;
let appStateSubscription: { remove: () => void } | null = null;
let lastAppState: AppStateStatus = AppState.currentState;

export function isJournalSessionUnlocked(): boolean {
  return Date.now() < unlockExpiresAtMs;
}

export function lockJournalSession(): void {
  unlockExpiresAtMs = 0;
}

export async function getJournalLockCapability(): Promise<JournalLockCapability> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);

  return {
    available: hasHardware && isEnrolled,
    hasHardware,
    isEnrolled,
  };
}

export async function ensureJournalUnlocked(): Promise<JournalUnlockResult> {
  const settings = await getSecuritySettings();

  if (!settings.journalLockEnabled) {
    return 'not_required';
  }

  if (isJournalSessionUnlocked()) {
    return 'granted';
  }

  const capability = await getJournalLockCapability();
  if (!capability.available) {
    return 'unavailable';
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock your journal',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return 'cancelled';
    }

    unlockExpiresAtMs = Date.now() + settings.journalUnlockTimeoutMinutes * 60 * 1000;
    return 'granted';
  } catch (error) {
    console.warn('Journal unlock authentication failed.', error);
    return 'cancelled';
  }
}

export function initializeJournalSecurityLifecycle(): void {
  if (lifecycleInitialized) return;
  lifecycleInitialized = true;

  appStateSubscription = AppState.addEventListener('change', (nextState) => {
    const previousState = lastAppState;
    lastAppState = nextState;

    if (previousState === 'active' && nextState !== 'active') {
      void (async () => {
        const settings = await getSecuritySettings();
        if (settings.journalLockEnabled && settings.relockOnBackground) {
          lockJournalSession();
        }
      })();
    }
  });
}

export function stopJournalSecurityLifecycle(): void {
  if (!lifecycleInitialized) return;
  appStateSubscription?.remove();
  appStateSubscription = null;
  lifecycleInitialized = false;
}
