import { storage } from '@/storage/asyncStorage';

const SECURITY_SETTINGS_KEY = 'kaarma_security_settings_v1';

export interface SecuritySettings {
  journalLockEnabled: boolean;
  journalUnlockTimeoutMinutes: number;
  relockOnBackground: boolean;
}

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  journalLockEnabled: false,
  journalUnlockTimeoutMinutes: 5,
  relockOnBackground: true,
};

function normalizeSettings(raw: Partial<SecuritySettings> | null): SecuritySettings {
  if (!raw) return DEFAULT_SECURITY_SETTINGS;

  const timeoutCandidate = Number(raw.journalUnlockTimeoutMinutes);
  const timeout =
    Number.isFinite(timeoutCandidate) && timeoutCandidate >= 1 && timeoutCandidate <= 60
      ? Math.round(timeoutCandidate)
      : DEFAULT_SECURITY_SETTINGS.journalUnlockTimeoutMinutes;

  return {
    journalLockEnabled: Boolean(raw.journalLockEnabled),
    journalUnlockTimeoutMinutes: timeout,
    relockOnBackground:
      typeof raw.relockOnBackground === 'boolean'
        ? raw.relockOnBackground
        : DEFAULT_SECURITY_SETTINGS.relockOnBackground,
  };
}

export async function getSecuritySettings(): Promise<SecuritySettings> {
  const stored = await storage.getItem<SecuritySettings>(SECURITY_SETTINGS_KEY, null);
  return normalizeSettings(stored);
}

export async function saveSecuritySettings(nextSettings: SecuritySettings): Promise<SecuritySettings> {
  const normalized = normalizeSettings(nextSettings);
  await storage.setItem(SECURITY_SETTINGS_KEY, normalized);
  return normalized;
}

export async function updateSecuritySettings(
  updates: Partial<SecuritySettings>,
): Promise<SecuritySettings> {
  const current = await getSecuritySettings();
  return saveSecuritySettings({
    ...current,
    ...updates,
  });
}

export async function isJournalLockEnabled(): Promise<boolean> {
  const settings = await getSecuritySettings();
  return settings.journalLockEnabled;
}
