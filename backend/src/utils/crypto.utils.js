import crypto from 'crypto';
import { config } from '../config/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from the master secret string.
 */
const getEncryptionKey = (secretKey) => {
  const key = secretKey || config.jwt.secret;
  return crypto.createHash('sha256').update(key).digest();
};

/**
 * Encrypts arbitrary text or data payload using AES-256-GCM.
 */
export const encryptCredentials = (data, customSecret) => {
  if (!data) return null;
  const key = getEncryptionKey(customSecret);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const textToEncrypt = typeof data === 'string' ? data : JSON.stringify(data);
  let encrypted = cipher.update(textToEncrypt, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts an AES-256-GCM encrypted string back to raw text or object.
 */
export const decryptCredentials = (encryptedPayload, customSecret) => {
  if (!encryptedPayload) return null;
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey(customSecret);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
};

/**
 * Safely masks secret keys for logging/telemetry purposes.
 * e.g., "sk-or-v1-abcdef1234567890" -> "sk-or-v1-••••••••7890"
 */
export const maskSecret = (secret) => {
  if (!secret || typeof secret !== 'string') return '••••••••';
  if (secret.length <= 8) return '••••' + secret.slice(-2);
  const prefix = secret.startsWith('sk-or-') ? secret.slice(0, 9) : secret.slice(0, 4);
  const suffix = secret.slice(-4);
  return `${prefix}••••••••${suffix}`;
};
