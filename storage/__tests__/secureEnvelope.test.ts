import assert from 'node:assert/strict';
import test from 'node:test';
import CryptoJS from 'crypto-js';
import {
  AES_GCM_NONCE_BYTES,
  decryptEnvelope,
  encryptEnvelope,
  type EncryptedEnvelope,
} from '../secureEnvelope';

test('secure envelope v3 AES-GCM encrypt/decrypt roundtrip works', () => {
  const keyHex = 'a'.repeat(64);
  const iv = new Uint8Array(AES_GCM_NONCE_BYTES).fill(7);
  const payload = {
    id: 'entry-1',
    mood: 4,
    tags: ['focus', 'gratitude'],
  };

  const encrypted = encryptEnvelope(payload, keyHex, iv, '2026-04-21T00:00:00.000Z');
  const decrypted = decryptEnvelope<typeof payload>(encrypted, keyHex);

  assert.equal(encrypted.version, 3);
  assert.equal(encrypted.ivHex, '070707070707070707070707');
  assert.deepEqual(decrypted, payload);
});

test('secure envelope v3 truncates longer IVs to 12-byte GCM nonce', () => {
  const keyHex = 'c'.repeat(64);
  const iv = new Uint8Array(16).fill(9);
  const payload = { ok: true };

  const encrypted = encryptEnvelope(payload, keyHex, iv);
  assert.equal(encrypted.version, 3);
  assert.equal(encrypted.ivHex?.length, 24);
  assert.deepEqual(decryptEnvelope<typeof payload>(encrypted, keyHex), payload);
});

test('secure envelope supports legacy v2 CBC decrypt', () => {
  const keyHex = 'd'.repeat(64);
  const ivHex = '0102030405060708090a0b0c0d0e0f10';
  const payload = { legacy: 'v2', count: 2 };

  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), CryptoJS.enc.Hex.parse(keyHex), {
    iv: CryptoJS.enc.Hex.parse(ivHex),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const legacyEnvelope: EncryptedEnvelope = {
    version: 2,
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    encryptedAt: '2026-04-21T00:00:00.000Z',
    ivHex,
  };

  assert.deepEqual(decryptEnvelope<typeof payload>(legacyEnvelope, keyHex), payload);
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

test('new encryptEnvelope writes are always version 3 GCM', () => {
  const encrypted = encryptEnvelope({ a: 1 }, 'e'.repeat(64), new Uint8Array(12).fill(1));
  assert.equal(encrypted.version, 3);
});
