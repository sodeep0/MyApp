import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { storage } from '@/storage/asyncStorage';
import { bytesToHex, decryptEnvelope, encryptEnvelope, type EncryptedEnvelope } from '@/storage/secureEnvelope';
import { resolveSensitiveRead } from '@/storage/sensitiveDataResolver';

interface SensitiveItemOptions<T> {
  secureKey: string;
  legacyKey: string;
  defaultValue: T;
}

interface SetSensitiveItemOptions<T> {
  secureKey: string;
  legacyKey?: string;
  value: T;
}

const ENCRYPTION_KEY_BYTES = 32;
const ENCRYPTION_KEY_ALIAS = 'kaarma_sensitive_data_encryption_key_v1';
const ENCRYPTION_KEY_FALLBACK = 'kaarma_sensitive_data_encryption_key_web_v1';
const SECURE_STORE_FALLBACK_KEY = 'kaarma_sensitive_data_encryption_key_fallback_v1';
const SENSITIVE_DATA_RECOVERY_STATE_KEY = 'kaarma_sensitive_data_recovery_state_v1';

export const SENSITIVE_DATA_KEY_PAIRS = [
  {
    secureKey: 'kaarma_secure_journal_entries_v1',
    legacyKey: 'kaarma_journal_entries',
  },
  {
    secureKey: 'kaarma_secure_bad_habits_v1',
    legacyKey: 'kaarma_bad_habits',
  },
  {
    secureKey: 'kaarma_secure_urge_events_v1',
    legacyKey: 'kaarma_urge_events',
  },
] as const;

interface SensitiveDataRecoveryState {
  corruptedKeys: string[];
  lastDetectedAt: string | null;
}

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainService: 'kaarma-sensitive-data',
};

let keyPromise: Promise<string> | null = null;

function normalizeRecoveryState(
  state: Partial<SensitiveDataRecoveryState> | null,
): SensitiveDataRecoveryState {
  const corruptedKeys = Array.isArray(state?.corruptedKeys)
    ? state!.corruptedKeys.filter((value): value is string => typeof value === 'string' && value.length > 0)
    : [];

  return {
    corruptedKeys,
    lastDetectedAt:
      typeof state?.lastDetectedAt === 'string' && state.lastDetectedAt.length > 0
        ? state.lastDetectedAt
        : null,
  };
}

function createRandomKey(): string {
  try {
    return bytesToHex(Crypto.getRandomBytes(ENCRYPTION_KEY_BYTES));
  } catch (error) {
    throw new Error(
      'Secure random key generation failed. Sensitive local data cannot be encrypted safely.',
      { cause: error },
    );
  }
}

async function readKeyFromSecureStore(): Promise<string | null> {
  if (Platform.OS === 'web') {
    throw new Error(
      'Encrypted sensitive storage is not supported on web. Use iOS/Android with SecureStore.',
    );
  }

  try {
    return await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS, secureStoreOptions);
  } catch (error) {
    throw new Error(
      'SecureStore key read failed. Sensitive local data is unavailable until SecureStore works.',
      { cause: error },
    );
  }
}

async function writeKeyToSecureStore(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error(
      'Encrypted sensitive storage is not supported on web. Use iOS/Android with SecureStore.',
    );
  }

  try {
    await SecureStore.setItemAsync(ENCRYPTION_KEY_ALIAS, key, secureStoreOptions);
  } catch (error) {
    throw new Error(
      'SecureStore key write failed. Refusing to store encryption keys in AsyncStorage.',
      { cause: error },
    );
  }
}

async function getOrCreateEncryptionKey(): Promise<string> {
  if (keyPromise) return keyPromise;

  keyPromise = (async () => {
    const existing = await readKeyFromSecureStore();
    if (existing) return existing;

    const created = createRandomKey();
    await writeKeyToSecureStore(created);
    return created;
  })();

  return keyPromise;
}

async function getSensitiveDataRecoveryStateRaw(): Promise<SensitiveDataRecoveryState> {
  const stored = await storage.getItem<SensitiveDataRecoveryState>(SENSITIVE_DATA_RECOVERY_STATE_KEY, null);
  return normalizeRecoveryState(stored);
}

async function saveSensitiveDataRecoveryStateRaw(state: SensitiveDataRecoveryState): Promise<void> {
  const normalized = normalizeRecoveryState(state);
  await storage.setItem(SENSITIVE_DATA_RECOVERY_STATE_KEY, normalized);
}

async function markSensitiveDataCorrupted(secureKey: string): Promise<void> {
  const state = await getSensitiveDataRecoveryStateRaw();
  if (state.corruptedKeys.includes(secureKey)) return;

  await saveSensitiveDataRecoveryStateRaw({
    corruptedKeys: [...state.corruptedKeys, secureKey],
    lastDetectedAt: new Date().toISOString(),
  });
}

async function clearSensitiveDataCorruption(secureKey: string): Promise<void> {
  const state = await getSensitiveDataRecoveryStateRaw();
  if (!state.corruptedKeys.includes(secureKey)) return;

  const nextKeys = state.corruptedKeys.filter((value) => value !== secureKey);
  await saveSensitiveDataRecoveryStateRaw({
    corruptedKeys: nextKeys,
    lastDetectedAt: nextKeys.length > 0 ? state.lastDetectedAt : null,
  });
}

export async function getSensitiveDataRecoveryState(): Promise<{
  hasRecoverableError: boolean;
  corruptedKeys: string[];
  lastDetectedAt: string | null;
}> {
  const state = await getSensitiveDataRecoveryStateRaw();
  return {
    hasRecoverableError: state.corruptedKeys.length > 0,
    corruptedKeys: state.corruptedKeys,
    lastDetectedAt: state.lastDetectedAt,
  };
}

export async function clearSensitiveDataRecoveryState(): Promise<void> {
  await storage.removeItem(SENSITIVE_DATA_RECOVERY_STATE_KEY);
}

export async function resetSensitiveDataStorage(): Promise<void> {
  for (const entry of SENSITIVE_DATA_KEY_PAIRS) {
    await storage.removeItem(entry.secureKey);
    await storage.removeItem(entry.legacyKey);
  }

  await clearSensitiveDataRecoveryState();

  if (Platform.OS !== 'web') {
    try {
      await SecureStore.deleteItemAsync(ENCRYPTION_KEY_ALIAS, secureStoreOptions);
    } catch (error) {
      console.warn('SecureStore key delete failed during sensitive reset.', error);
    }
  }

  await storage.removeItem(SECURE_STORE_FALLBACK_KEY);
  await storage.removeItem(ENCRYPTION_KEY_FALLBACK);

  keyPromise = null;
}

export async function setSensitiveItem<T>({
  secureKey,
  legacyKey,
  value,
}: SetSensitiveItemOptions<T>): Promise<void> {
  const key = await getOrCreateEncryptionKey();
  let ivBytes: Uint8Array;
  try {
    // AES-GCM (envelope v3) uses a 12-byte nonce.
    ivBytes = Crypto.getRandomBytes(12) as Uint8Array;
  } catch (error) {
    throw new Error(
      'Secure IV generation failed. Sensitive local data cannot be encrypted safely.',
      { cause: error },
    );
  }

  const payload = encryptEnvelope(value, key, ivBytes);
  await storage.setItem(secureKey, payload);
  await clearSensitiveDataCorruption(secureKey);

  if (legacyKey) {
    await storage.removeItem(legacyKey);
  }
}

export async function getSensitiveItem<T>({
  secureKey,
  legacyKey,
  defaultValue,
}: SensitiveItemOptions<T>): Promise<T> {
  const encrypted = await storage.getItem<EncryptedEnvelope>(secureKey, null);
  const legacy = await storage.getItem<T>(legacyKey, null);

  const resolution = await resolveSensitiveRead<T>({
    encrypted,
    legacy,
    defaultValue,
    decryptEncrypted: async (envelope) => {
      const key = await getOrCreateEncryptionKey();
      return decryptEnvelope<T>(envelope, key);
    },
  });

  if (resolution.isCorrupted) {
    console.warn(`Sensitive data for key "${secureKey}" could not be decrypted. Recovery is required.`);
    await markSensitiveDataCorrupted(secureKey);
  } else {
    await clearSensitiveDataCorruption(secureKey);
  }

  if (resolution.shouldMigrateLegacy) {
    await setSensitiveItem({
      secureKey,
      legacyKey,
      value: resolution.value,
    });
  }

  return resolution.value;
}

export async function removeSensitiveItem(secureKey: string, legacyKey?: string): Promise<void> {
  await storage.removeItem(secureKey);
  if (legacyKey) {
    await storage.removeItem(legacyKey);
  }
  await clearSensitiveDataCorruption(secureKey);
}
