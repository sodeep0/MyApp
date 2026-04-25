import assert from 'node:assert/strict';
import test from 'node:test';
import type { EncryptedEnvelope } from '../secureEnvelope';
import { resolveSensitiveRead } from '../sensitiveDataResolver';

const envelope: EncryptedEnvelope = {
  version: 2,
  ciphertext: 'ciphertext',
  ivHex: '00112233445566778899aabbccddeeff',
  encryptedAt: '2026-04-21T00:00:00.000Z',
};

test('resolveSensitiveRead prefers encrypted data when decrypt succeeds', async () => {
  const result = await resolveSensitiveRead({
    encrypted: envelope,
    legacy: ['legacy'],
    defaultValue: [],
    decryptEncrypted: async () => ['encrypted'],
  });

  assert.equal(result.source, 'encrypted');
  assert.equal(result.shouldMigrateLegacy, false);
  assert.equal(result.isCorrupted, false);
  assert.deepEqual(result.value, ['encrypted']);
});

test('resolveSensitiveRead falls back to legacy and requests migration when encrypted is corrupted', async () => {
  const result = await resolveSensitiveRead({
    encrypted: envelope,
    legacy: ['legacy'],
    defaultValue: [],
    decryptEncrypted: async () => null,
  });

  assert.equal(result.source, 'legacy');
  assert.equal(result.shouldMigrateLegacy, true);
  assert.equal(result.isCorrupted, true);
  assert.deepEqual(result.value, ['legacy']);
});

test('resolveSensitiveRead falls back to default when both encrypted and legacy are unavailable', async () => {
  const result = await resolveSensitiveRead({
    encrypted: envelope,
    legacy: null,
    defaultValue: ['default'],
    decryptEncrypted: async () => {
      throw new Error('decrypt failed');
    },
  });

  assert.equal(result.source, 'default');
  assert.equal(result.shouldMigrateLegacy, false);
  assert.equal(result.isCorrupted, true);
  assert.deepEqual(result.value, ['default']);
});
