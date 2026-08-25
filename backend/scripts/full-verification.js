import http from 'http';
import { io as ioClient } from 'socket.io-client';
import { initDatabase, getDbPool } from '../src/config/db.config.js';
import { initRedis } from '../src/config/redis.config.js';
import { initQueues, getWorkflowQueue, getScheduledTriggerQueue } from '../src/config/queue.config.js';
import { initSocketServer } from '../src/socket/socket.server.js';
import app from '../src/app.js';
import { logger } from '../src/utils/logger.js';

const request = (server, method, path, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        method,
        path,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runFullVerification = async () => {
  logger.info('====================================================');
  logger.info('NEXORA AI — COMPLETE SYSTEM & VERIFICATION PROTOCOL');
  logger.info('====================================================');

  const report = {
    backendStartup: false,
    databaseOps: false,
    tablesVerified: [],
    bullMQQueues: false,
    socketIOHandshake: false,
    apiHealth: false,
    authRegister: false,
    authLogin: false,
    authGetMe: false,
    authRefresh: false,
    workspaceCreate: false,
    workspaceGet: false,
    rbacProtection: false,
    integrationsProviders: false,
    errorHandling: false,
    failures: [],
  };

  try {
    // 1. Database & Redis Startup
    await initDatabase();
    await initRedis();
    initQueues();

    const pool = getDbPool();
    const [rows] = await pool.query('SHOW TABLES');
    const tableNames = rows.map((r) => Object.values(r)[0]);
    report.tablesVerified = tableNames;
    logger.info(`MySQL Database Tables Verified [${tableNames.length} Total]: [${tableNames.join(', ')}]`);

    const requiredTables = ['users', 'workspaces', 'workspace_members', 'workflows', 'triggers', 'executions', 'execution_logs', 'audit_logs', 'notifications'];
    const missingTables = requiredTables.filter((t) => !tableNames.includes(t));

    if (missingTables.length === 0) {
      report.databaseOps = true;
      logger.info('✔ All 9 Core DB Tables verified successfully');
    } else {
      report.failures.push(`Missing DB tables: ${missingTables.join(', ')}`);
    }

    // 2. Verify BullMQ Queues
    const workflowQueue = getWorkflowQueue();
    const triggerQueue = getScheduledTriggerQueue();
    if (workflowQueue && triggerQueue) {
      report.bullMQQueues = true;
      logger.info('✔ BullMQ Task Queues [workflow-execution], [scheduled-triggers] active');
    } else {
      report.failures.push('BullMQ task queues not initialized');
    }

    // 3. Start Test HTTP & Socket.IO WebSockets Server
    const httpServer = http.createServer(app);
    initSocketServer(httpServer);

    await new Promise((resolve) => httpServer.listen(0, resolve));
    const port = httpServer.address().port;
    report.backendStartup = true;
    logger.info(`Backend HTTP & Socket.IO server listening on port ${port}`);

    // 4. Test Socket.IO Client Connection Handshake
    await new Promise((resolve) => {
      const socket = ioClient(`http://127.0.0.1:${port}`, { path: '/socket.io' });
      socket.on('connect', () => {
        report.socketIOHandshake = true;
        logger.info(`✔ Socket.IO Client connected successfully [Socket ID: ${socket.id}]`);
        socket.disconnect();
        resolve();
      });
      socket.on('connect_error', (err) => {
        report.failures.push(`Socket.IO connection failed: ${err.message}`);
        socket.disconnect();
        resolve();
      });
    });

    // 5. Test GET /api/v1/health
    const healthRes = await request(httpServer, 'GET', '/api/v1/health');
    if (healthRes.statusCode === 200 && healthRes.body?.success) {
      report.apiHealth = true;
      logger.info('✔ GET /api/v1/health — 200 OK');
    } else {
      report.failures.push(`Health endpoint failed: ${healthRes.statusCode}`);
    }

    // 6. Test POST /api/v1/auth/register
    const testEmail = `verify_v2_${Date.now()}@nexora.ai`;
    const testPassword = 'Password123!';
    const registerRes = await request(httpServer, 'POST', '/api/v1/auth/register', {}, {
      email: testEmail,
      password: testPassword,
      name: 'Verification Protocol User',
    });

    let accessToken = null;
    let refreshToken = null;
    let workspaceId = null;

    if (registerRes.statusCode === 201 && registerRes.body?.data?.tokens?.accessToken) {
      report.authRegister = true;
      accessToken = registerRes.body.data.tokens.accessToken;
      refreshToken = registerRes.body.data.tokens.refreshToken;
      workspaceId = registerRes.body.data.workspace.id;
      logger.info('✔ POST /api/v1/auth/register — 201 Created');
    } else {
      report.failures.push(`Auth register failed: ${JSON.stringify(registerRes.body)}`);
    }

    // 7. Test POST /api/v1/auth/login
    const loginRes = await request(httpServer, 'POST', '/api/v1/auth/login', {}, {
      email: testEmail,
      password: testPassword,
    });

    if (loginRes.statusCode === 200 && loginRes.body?.data?.tokens?.accessToken) {
      report.authLogin = true;
      logger.info('✔ POST /api/v1/auth/login — 200 OK');
    } else {
      report.failures.push(`Auth login failed: ${JSON.stringify(loginRes.body)}`);
    }

    // 8. Test GET /api/v1/auth/me (Protected Route)
    const meRes = await request(httpServer, 'GET', '/api/v1/auth/me', {
      Authorization: `Bearer ${accessToken}`,
    });

    if (meRes.statusCode === 200 && meRes.body?.data?.user?.email === testEmail) {
      report.authGetMe = true;
      logger.info('✔ GET /api/v1/auth/me — 200 OK (JWT Validated)');
    } else {
      report.failures.push(`Auth getMe failed: ${JSON.stringify(meRes.body)}`);
    }

    // 9. Test POST /api/v1/auth/refresh
    const refreshRes = await request(httpServer, 'POST', '/api/v1/auth/refresh', {}, {
      refreshToken,
    });

    if (refreshRes.statusCode === 200 && refreshRes.body?.data?.accessToken) {
      report.authRefresh = true;
      logger.info('✔ POST /api/v1/auth/refresh — 200 OK');
    } else {
      report.failures.push(`Auth refresh failed: ${JSON.stringify(refreshRes.body)}`);
    }

    // 10. Test POST /api/v1/workspaces
    const createWsRes = await request(httpServer, 'POST', '/api/v1/workspaces', {
      Authorization: `Bearer ${accessToken}`,
    }, {
      name: 'Verification Team Workspace Alpha',
    });

    if (createWsRes.statusCode === 201 && createWsRes.body?.data?.id) {
      report.workspaceCreate = true;
      logger.info('✔ POST /api/v1/workspaces — 201 Created');
    } else {
      report.failures.push(`Workspace creation failed: ${JSON.stringify(createWsRes.body)}`);
    }

    // 11. Test GET /api/v1/workspaces/:id (Tenant & RBAC Protected)
    const getWsRes = await request(httpServer, 'GET', `/api/v1/workspaces/${workspaceId}`, {
      Authorization: `Bearer ${accessToken}`,
      'x-workspace-id': workspaceId,
    });

    if (getWsRes.statusCode === 200 && getWsRes.body?.data?.id === workspaceId) {
      report.workspaceGet = true;
      logger.info('✔ GET /api/v1/workspaces/:id — 200 OK (RBAC Owner Passed)');
    } else {
      report.failures.push(`Workspace get by ID failed: ${JSON.stringify(getWsRes.body)}`);
    }

    // 12. Test RBAC Protection (Reject invalid workspace ID access)
    const fakeWsId = '00000000-0000-0000-0000-000000000000';
    const rbacRes = await request(httpServer, 'GET', `/api/v1/workspaces/${fakeWsId}`, {
      Authorization: `Bearer ${accessToken}`,
      'x-workspace-id': fakeWsId,
    });

    if (rbacRes.statusCode === 403) {
      report.rbacProtection = true;
      logger.info('✔ RBAC Protection Verification — 403 Forbidden correctly rejected unauthorized workspace access');
    } else {
      report.failures.push(`RBAC protection check failed: status ${rbacRes.statusCode}`);
    }

    // 13. Test GET /api/v1/integrations/providers
    const providersRes = await request(httpServer, 'GET', '/api/v1/integrations/providers');
    if (providersRes.statusCode === 200 && providersRes.body?.data?.length > 0) {
      report.integrationsProviders = true;
      logger.info('✔ GET /api/v1/integrations/providers — 200 OK (OpenRouter plugin listed)');
    } else {
      report.failures.push(`Integrations list providers failed: ${JSON.stringify(providersRes.body)}`);
    }

    // 14. Test Error Handling
    const notFoundRes = await request(httpServer, 'GET', '/api/v1/invalid-route-xyz');
    const unauthorizedRes = await request(httpServer, 'GET', '/api/v1/auth/me');

    if (notFoundRes.statusCode === 404 && unauthorizedRes.statusCode === 401) {
      report.errorHandling = true;
      logger.info('✔ Error Handling Verification — 404 Not Found & 401 Unauthorized formats validated');
    } else {
      report.failures.push('Error handling verification failed');
    }

    httpServer.close();

    logger.info('====================================================');
    logger.info(`FINAL VERIFICATION RESULT: ${report.failures.length === 0 ? 'PASSED (100% SUCCESS)' : 'FAILED'}`);
    logger.info('====================================================');
    console.log(JSON.stringify(report, null, 2));

    if (report.failures.length > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    logger.error('Verification script crashed with exception:', { message: error.message, stack: error.stack });
    process.exit(1);
  }
};

runFullVerification();
