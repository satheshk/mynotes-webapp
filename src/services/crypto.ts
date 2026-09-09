import { EncryptedPayload } from '../types';

export const CANARY_TEXT = 'KEEP_E2EE_CANARY_VERIFIED_V1';
const PBKDF2_ITERATIONS = 100000;

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function generateSalt(): string {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  return bufferToBase64(saltBytes);
}

/**
 * Derives a 256-bit AES-GCM key from a passphrase and salt using PBKDF2-SHA256
 */
export async function deriveKeyFromPassphrase(passphrase: string, saltBase64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const salt = base64ToBuffer(saltBase64);

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts an object using AES-256-GCM
 */
export async function encryptData<T>(data: T, key: CryptoKey, saltBase64: string): Promise<EncryptedPayload> {
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(data));
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV standard for AES-GCM

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128,
    },
    key,
    plaintext
  );

  return {
    v: 1,
    salt: saltBase64,
    iv: bufferToBase64(iv),
    data: bufferToBase64(ciphertextBuffer),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Decrypts an EncryptedPayload using AES-256-GCM
 */
export async function decryptData<T>(payload: EncryptedPayload, key: CryptoKey): Promise<T> {
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.data);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128,
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    const jsonString = dec.decode(decryptedBuffer);
    return JSON.parse(jsonString) as T;
  } catch (err) {
    throw new Error('Decryption failed. Incorrect encryption passphrase or corrupt payload.');
  }
}

/**
 * Creates an encrypted verification canary to validate passphrases
 */
export async function createCanary(key: CryptoKey, saltBase64: string): Promise<EncryptedPayload> {
  return encryptData({ canary: CANARY_TEXT }, key, saltBase64);
}

/**
 * Validates whether the given key can successfully decrypt the canary
 */
export async function verifyCanary(canaryPayload: EncryptedPayload, key: CryptoKey): Promise<boolean> {
  try {
    const result = await decryptData<{ canary: string }>(canaryPayload, key);
    return result.canary === CANARY_TEXT;
  } catch {
    return false;
  }
}

/**
 * Generates an easy-to-remember yet high-entropy passphrase
 */
export function generateSuggestedPassphrase(): string {
  const words = [
    'coral', 'drift', 'nebula', 'amber', 'falcon', 'summit', 'glacier', 'beacon',
    'echo', 'meadow', 'sapphire', 'velvet', 'aurora', 'stride', 'zenith', 'canyon',
    'lotus', 'breeze', 'harbor', 'quartz', 'vortex', 'spruce', 'willow', 'radiant'
  ];
  const selected: string[] = [];
  const randomValues = new Uint32Array(4);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 4; i++) {
    selected.push(words[randomValues[i] % words.length]);
  }
  const digit = Math.floor(Math.random() * 90 + 10);
  return `${selected.join('-')}-${digit}`;
}
