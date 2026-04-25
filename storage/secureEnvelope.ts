import CryptoJS from 'crypto-js';

export interface EncryptedEnvelope {
  version: 1 | 2;
  ciphertext: string;
  encryptedAt: string;
  ivHex?: string;
}

export function bytesToHex(bytes: Uint8Array): string {
  let output = '';
  bytes.forEach((byte) => {
    output += byte.toString(16).padStart(2, '0');
  });
  return output;
}

export function encryptEnvelope<T>(
  value: T,
  keyHex: string,
  ivBytes: Uint8Array,
  encryptedAt: string = new Date().toISOString(),
): EncryptedEnvelope {
  const ivHex = bytesToHex(ivBytes);
  const iv = CryptoJS.enc.Hex.parse(ivHex);
  const keyWordArray = CryptoJS.enc.Hex.parse(keyHex);
  const plaintext = JSON.stringify(value);

  const encrypted = CryptoJS.AES.encrypt(plaintext, keyWordArray, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    version: 2,
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    encryptedAt,
    ivHex,
  };
}

export function decryptEnvelope<T>(envelope: EncryptedEnvelope, keyHex: string): T | null {
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
    // Legacy fallback for payloads encrypted in passphrase mode.
    const bytes = CryptoJS.AES.decrypt(envelope.ciphertext, keyHex);
    plaintext = bytes.toString(CryptoJS.enc.Utf8);
  }

  if (!plaintext) return null;
  return JSON.parse(plaintext) as T;
}
