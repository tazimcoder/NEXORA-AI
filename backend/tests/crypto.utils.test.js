import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptCredentials, decryptCredentials, maskSecret } from '../src/utils/crypto.utils.js';

test('crypto.utils - encrypt and decrypt credentials payload', () => {
  const secretPayload = { apiKey: 'sk-or-v1-1234567890abcdef', siteName: 'NEXORA' };
  const encrypted = encryptCredentials(secretPayload);

  assert.equal(typeof encrypted, 'string');
  assert.equal(encrypted.split(':').length, 3);

  const decrypted = decryptCredentials(encrypted);
  assert.deepEqual(decrypted, secretPayload);
});

test('crypto.utils - secret masking', () => {
  assert.equal(maskSecret('sk-or-v1-1234567890abcdef'), 'sk-or-v1-••••••••cdef');
  assert.equal(maskSecret('short'), '••••rt');
  assert.equal(maskSecret(''), '••••••••');
});
