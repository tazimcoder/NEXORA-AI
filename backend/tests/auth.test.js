import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, closeDbPool } from '../src/config/db.config.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { usersService } from '../src/modules/users/users.service.js';
import { workspacesService } from '../src/modules/workspaces/workspaces.service.js';
import { ApiError } from '../src/utils/apiError.js';
import { requireRole } from '../src/middleware/role.middleware.js';

test('Comprehensive Auth & Users Foundation Test Suite', async (t) => {
  const dbConnected = await initDatabase();
  assert.equal(dbConnected, true, 'Database must be connected');

  t.after(async () => {
    await closeDbPool();
  });


  const testEmail = `auth_phase2_${Date.now()}@nexora.ai`;
  const testPassword = 'Password123!';
  const newPassword = 'NewPassword456!';
  const testName = 'Phase2 User';

  let registrationResult;

  await t.test('1. User Registration & Default Personal Workspace Creation', async () => {
    registrationResult = await authService.register({
      email: testEmail,
      password: testPassword,
      name: testName,
    });

    assert.ok(registrationResult.user.id);
    assert.equal(registrationResult.user.email, testEmail);
    assert.equal(registrationResult.user.role, 'user');
    assert.ok(registrationResult.workspace.id);
    assert.ok(registrationResult.tokens.accessToken);
    assert.ok(registrationResult.tokens.refreshToken);
  });

  await t.test('2. Reject Duplicate Email Registration', async () => {
    await assert.rejects(async () => {
      await authService.register({
        email: testEmail,
        password: testPassword,
        name: testName,
      });
    }, (err) => err instanceof ApiError && err.statusCode === 400 && err.code === 'EMAIL_TAKEN');
  });

  await t.test('3. Reject Invalid Login Credentials', async () => {
    await assert.rejects(async () => {
      await authService.login({
        email: testEmail,
        password: 'WrongPassword!',
      });
    }, (err) => err instanceof ApiError && err.statusCode === 401);
  });

  await t.test('4. Successful User Login', async () => {
    const loginResult = await authService.login({
      email: testEmail,
      password: testPassword,
    });

    assert.equal(loginResult.user.email, testEmail);
    assert.ok(loginResult.tokens.accessToken);
    assert.ok(loginResult.workspaces.length >= 1);
  });

  await t.test('5. Refresh Token Flow', async () => {
    const newTokens = await authService.refreshTokens(registrationResult.tokens.refreshToken);
    assert.ok(newTokens.accessToken);
    assert.ok(newTokens.refreshToken);
  });

  await t.test('6. User Profile Retrieval & Update', async () => {
    const profile = await usersService.getProfile(registrationResult.user.id);
    assert.equal(profile.email, testEmail);

    const updated = await usersService.updateProfile(registrationResult.user.id, { name: 'Updated Phase2 Name' });
    assert.equal(updated.name, 'Updated Phase2 Name');
  });

  await t.test('7. Password Change & Re-authentication', async () => {
    // Attempt change with wrong old password -> 401
    await assert.rejects(async () => {
      await usersService.changePassword(registrationResult.user.id, {
        oldPassword: 'WrongOldPassword!',
        newPassword,
      });
    }, (err) => err instanceof ApiError && err.statusCode === 401);

    // Valid password change
    const changeResult = await usersService.changePassword(registrationResult.user.id, {
      oldPassword: testPassword,
      newPassword,
    });
    assert.equal(changeResult.success, true);

    // Login with new password
    const newLogin = await authService.login({
      email: testEmail,
      password: newPassword,
    });
    assert.ok(newLogin.tokens.accessToken);
  });

  await t.test('8. Logout Session Termination', async () => {
    const logoutResult = await authService.logout(registrationResult.user.id);
    assert.equal(logoutResult.loggedOut, true);
  });

  await t.test('9. System Role Middleware Verification', () => {
    const middleware = requireRole('admin');
    let nextCalledWithError = null;

    // Normal user context -> expect 403 Forbidden
    middleware({ user: { role: 'user' } }, {}, (err) => {
      nextCalledWithError = err;
    });

    assert.ok(nextCalledWithError instanceof ApiError);
    assert.equal(nextCalledWithError.statusCode, 403);

    // Admin user context -> expect pass (next called with no error)
    let adminPassed = false;
    middleware({ user: { role: 'admin' } }, {}, (err) => {
      if (!err) adminPassed = true;
    });
    assert.equal(adminPassed, true);
  });
});
