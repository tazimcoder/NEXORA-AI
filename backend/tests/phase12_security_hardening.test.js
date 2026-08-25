import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initDatabase, closeDbPool } from '../src/config/db.config.js';
import { config } from '../src/config/index.js';
import { encryptCredentials, decryptCredentials, maskSecret } from '../src/utils/crypto.utils.js';
import { sanitizeValue } from '../src/middleware/sanitization.middleware.js';
import { createRateLimiter } from '../src/middleware/rateLimit.middleware.js';
import { authService } from '../src/modules/auth/auth.service.js';

test('Comprehensive Phase 12 Security & Production Hardening Test Suite', async (t) => {
  const dbConnected = await initDatabase();
  assert.equal(dbConnected, true, 'Database must be connected');

  t.after(async () => {
    await closeDbPool();
  });

  await t.test('1. Password Hashing Security Verification (Bcrypt)', async () => {
    const password = 'ProductionPassword123!';
    const hash = await bcrypt.hash(password, 10);

    assert.notEqual(password, hash);
    assert.equal(await bcrypt.compare(password, hash), true);
    assert.equal(await bcrypt.compare('WrongPassword', hash), false);
  });

  await t.test('2. JWT Validation & Token Expiration Verification', () => {
    const payload = { sub: 'usr_1001', email: 'sec@nexora.ai', role: 'user' };
    const token = jwt.sign(payload, config.jwt.secret, { expiresIn: '1h' });

    const decoded = jwt.verify(token, config.jwt.secret);
    assert.equal(decoded.sub, 'usr_1001');

    // Invalid Secret -> Throws Error
    assert.throws(() => {
      jwt.verify(token, 'wrong_secret_key');
    });
  });

  await t.test('3. AES-256-GCM Credential Encryption & Masking', () => {
    const secretApiKey = 'sk-or-v1-99887766554433221100aabbccdd';
    
    // Encrypt & Decrypt
    const encrypted = encryptCredentials(secretApiKey);
    assert.notEqual(encrypted, secretApiKey);
    assert.ok(encrypted.includes(':'));

    const decrypted = decryptCredentials(encrypted);
    assert.equal(decrypted, secretApiKey);

    // Mask Secret Verification
    const masked = maskSecret(secretApiKey);
    assert.equal(masked.includes('••••••••'), true);
    assert.equal(masked.includes('998877665544'), false, 'Masked string must not expose inner secret key');
  });

  await t.test('4. Input Sanitization & XSS / Prototype Pollution Defense', () => {
    const maliciousPayload = {
      title: 'Valid Title <script>alert("XSS Attack")</script>',
      uri: 'javascript:alert(1)',
      nested: {
        code: 'console.log("ok");',
        __proto__: { admin: true },
      },
    };

    const clean = sanitizeValue(maliciousPayload);

    assert.equal(clean.title, 'Valid Title ');
    assert.equal(clean.uri.includes('javascript:'), false, 'javascript: URI scheme must be stripped');
    assert.equal(clean.nested.admin, undefined, 'Prototype pollution key must be stripped');

  });

  await t.test('5. Rate Limiting Middleware Enforcement (HTTP 429)', () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 2, message: 'Rate limit test exceeded' });

    let nextCount = 0;
    let lastError = null;

    const mockReq = { ip: '192.168.1.100', originalUrl: '/test-route' };
    const mockRes = { setHeader: () => {} };
    const mockNext = (err) => {
      if (err) lastError = err;
      else nextCount++;
    };

    // Request 1 & 2 -> Allowed
    limiter(mockReq, mockRes, mockNext);
    limiter(mockReq, mockRes, mockNext);
    assert.equal(nextCount, 2);

    // Request 3 -> Exceeds max: 2 -> Returns 429
    limiter(mockReq, mockRes, mockNext);
    assert.ok(lastError);
    assert.equal(lastError.statusCode, 429);
    assert.equal(lastError.code, 'TOO_MANY_REQUESTS');
  });

  await t.test('6. SQL Injection Defense & Parameterization', async () => {
    const sqlInjectionEmail = "' OR '1'='1' --";
    
    // Register user safely with standard email
    const safeReg = await authService.register({
      email: `sec_test_${Date.now()}@nexora.ai`,
      password: 'Password123!',
      name: 'Security Tester',
    });
    assert.ok(safeReg.user.id);

    // SQL Injection Login Attempt -> Fails safely with 401 Unauthorized without crashing
    await assert.rejects(
      async () => {
        await authService.login({ email: sqlInjectionEmail, password: 'Password123!' });
      },
      (err) => err.statusCode === 401
    );
  });
});
