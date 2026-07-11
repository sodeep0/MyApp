/**
 * Pure App Check gate / path helpers (no Firebase SDK).
 * Used by services/firebase/app.ts and unit tests.
 */

export type AppCheckInitPath =
  | 'disabled'
  | 'recaptcha-v3'
  | 'custom-debug-token'
  | 'custom-warn-only';

export function isAppCheckEnabledByEnv(
  flag: string | undefined = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK,
): boolean {
  return flag === 'true';
}

/**
 * Resolves which App Check initialization path would run for the given inputs.
 */
export function resolveAppCheckInitPath(options: {
  enabled: boolean;
  platform: string;
  siteKey?: string | undefined;
  debugToken?: string | undefined;
}): AppCheckInitPath {
  if (!options.enabled) return 'disabled';

  if (options.platform === 'web') {
    return options.siteKey ? 'recaptcha-v3' : 'custom-warn-only';
  }

  // Native: prefer @react-native-firebase/app-check when installed; otherwise CustomProvider.
  // Without a debug token we still mark initialized after a clear warning.
  return options.debugToken ? 'custom-debug-token' : 'custom-warn-only';
}

/** True when App Check is gated on (a concrete init path will run, including warn-only). */
export function isAppCheckInitPathAvailable(
  flag: string | undefined = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK,
): boolean {
  return isAppCheckEnabledByEnv(flag);
}
