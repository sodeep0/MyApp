import assert from 'node:assert/strict';
import test from 'node:test';
import CryptoJS from 'crypto-js';
import { decryptEnvelope, encryptEnvelope, type EncryptedEnvelope } from '../secureEnvelope';

test('secure envelope v2 encrypt/decrypt roundtrip works', () => {
  const keyHex = 'a'.repeat(64);
  const iv = new Uint8Array(16).fill(7);
  const payload = {
    id: 'entry-1',
    mood: 4,
    tags: ['focus', 'gratitude'],
  };

  const encrypted = encryptEnvelope(payload, keyHex, iv, '2026-04-21T00:00:00.000Z');
  const decrypted = decryptEnvelope<typeof payload>(encrypted, keyHex);

  assert.equal(encrypted.version, 2);
  assert.equal(encrypted.ivHex, '07070707070707070707070707070707');
  assert.deepEqual(decrypted, payload);
});

test('secure envelope supports legacy v1 decrypt fallback', () => {
  const keyHex = 'b'.repeat(64);
  const payload = {
    value: 'legacy-data',
    count: 3,
  };

  const legacyCiphertext = CryptoJS.AES.encrypt(JSON.stringify(payload), keyHex).toString();
  const legacyEnvelope: EncryptedEnvelope = {
    version: 1,
    ciphertext: legacyCiphertext,
    encryptedAt: '2026-04-21T00:00:00.000Z',
  };

  const decrypted = decryptEnvelope<typeof payload>(legacyEnvelope, keyHex);
  assert.deepEqual(decrypted, payload);
});
