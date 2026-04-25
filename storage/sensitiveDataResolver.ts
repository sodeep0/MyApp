import type { EncryptedEnvelope } from '@/storage/secureEnvelope';

export interface SensitiveReadResolution<T> {
  value: T;
  source: 'encrypted' | 'legacy' | 'default';
  shouldMigrateLegacy: boolean;
  isCorrupted: boolean;
}

interface ResolveSensitiveReadOptions<T> {
  encrypted: EncryptedEnvelope | null;
  legacy: T | null;
  defaultValue: T;
  decryptEncrypted: (encrypted: EncryptedEnvelope) => Promise<T | null>;
}

export async function resolveSensitiveRead<T>({
  encrypted,
  legacy,
  defaultValue,
  decryptEncrypted,
}: ResolveSensitiveReadOptions<T>): Promise<SensitiveReadResolution<T>> {
  let isCorrupted = false;

  if (encrypted?.ciphertext) {
    try {
      const decrypted = await decryptEncrypted(encrypted);
      if (decrypted !== null) {
        return {
          value: decrypted,
          source: 'encrypted',
          shouldMigrateLegacy: false,
          isCorrupted: false,
        };
      }
      isCorrupted = true;
    } catch {
      isCorrupted = true;
    }
  }

  if (legacy !== null) {
    return {
      value: legacy,
      source: 'legacy',
      shouldMigrateLegacy: true,
      isCorrupted,
    };
  }

  return {
    value: defaultValue,
    source: 'default',
    shouldMigrateLegacy: false,
    isCorrupted,
  };
}
