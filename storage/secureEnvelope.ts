/**
 * Local encrypted envelopes for sensitive journal / bad-habit data.
 *
 * Version history:
 * - v1: crypto-js passphrase mode (legacy)
 * - v2: AES-CBC + PKCS7 via crypto-js (legacy reads still supported)
 * - v3: AES-256-GCM via @noble/ciphers (all new writes)
 *
 * crypto-js is retained only for v1/v2 decrypt during migration. Next save
 * re-encrypts as v3 through secureDataStorage.setSensitiveItem.
 */
import { gcm } from '@noble/ciphers/aes.js';
import CryptoJS from 'crypto-js';

export interface EncryptedEnvelope {
  version: 1 | 2 | 3;
  ciphertext: string;
  encryptedAt: string;
  ivHex?: string;
}

export const AES_GCM_NONCE_BYTES = 12;

export function bytesToHex(bytes: Uint8Array): string {
  let output = '';
  bytes.forEach((byte) => {
    output += byte.toString(16).padStart(2, '0');
  });
  return output;
}

export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.length % 2 === 0 ? hex : `0${hex}`;
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return globalThis.btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(value, 'base64'));
  }
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function utf8Encode(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function utf8Decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function resolveGcmNonce(ivBytes: Uint8Array): Uint8Array {
  if (ivBytes.length === AES_GCM_NONCE_BYTES) {
    return ivBytes;
  }
  if (ivBytes.length > AES_GCM_NONCE_BYTES) {
    return ivBytes.slice(0, AES_GCM_NONCE_BYTES);
  }
  throw new Error(`AES-GCM nonce must be at least ${AES_GCM_NONCE_BYTES} bytes.`);
}

/**
 * Encrypt with AES-256-GCM (envelope version 3).
 * `ivBytes` should be 12 random bytes (expo-crypto getRandomBytes); longer inputs are truncated.
 */
export function encryptEnvelope<T>(
  value: T,
  keyHex: string,
  ivBytes: Uint8Array,
  encryptedAt: string = new Date().toISOString(),
): EncryptedEnvelope {
  const nonce = resolveGcmNonce(ivBytes);
  const key = hexToBytes(keyHex);
  if (key.length !== 32) {
    throw new Error('AES-256-GCM requires a 32-byte (64 hex char) key.');
  }

  const plaintext = utf8Encode(JSON.stringify(value));
  const sealed = gcm(key, nonce).encrypt(plaintext);

  return {
    version: 3,
    ciphertext: bytesToBase64(sealed),
    encryptedAt,
    ivHex: bytesToHex(nonce),
  };
}

function decryptV3<T>(envelope: EncryptedEnvelope, keyHex: string): T | null {
  if (!envelope.ivHex) return null;

  try {
    const key = hexToBytes(keyHex);
    const nonce = hexToBytes(envelope.ivHex);
    const sealed = base64ToBytes(envelope.ciphertext);
    const plaintext = gcm(key, nonce).decrypt(sealed);
    return JSON.parse(utf8Decode(plaintext)) as T;
  } catch {
    return null;
  }
}

function decryptLegacyCbc<T>(envelope: EncryptedEnvelope, keyHex: string): T | null {
  let plaintext = '';

  if (envelope.version === 2 && envelope.ivHex) {
    const iv = CryptoJS.enc.Hex.parse(envelope.ivHex);
    const keyWordArray = CryptoJS.enc.Hex.parse(keyHex);
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(envelope.ciphertext),
    });

    const bytes = CryptoJS.AES.decrypt(cipherParams, keyWordArray, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    plaintext = bytes.toString(CryptoJS.enc.Utf8);
  } else {
    // Legacy fallback for payloads encrypted in passphrase mode (v1).
    const bytes = CryptoJS.AES.decrypt(envelope.ciphertext, keyHex);
    plaintext = bytes.toString(CryptoJS.enc.Utf8);
  }

  if (!plaintext) return null;
  return JSON.parse(plaintext) as T;
}

export function decryptEnvelope<T>(envelope: EncryptedEnvelope, keyHex: string): T | null {
  if (envelope.version === 3) {
    return decryptV3<T>(envelope, keyHex);
  }

  return decryptLegacyCbc<T>(envelope, keyHex);
}
