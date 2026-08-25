import { Router } from 'express';
import { checkDatabaseHealth } from '../config/db.config.js';
import { checkRedisHealth } from '../config/redis.config.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { config } from '../config/index.js';

const router = Router();

router.get('/health', async (req, res, next) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    const redisHealth = await checkRedisHealth();

    const isSystemHealthy = dbHealth.status === 'connected' && redisHealth.status === 'connected';

    const healthData = {
      app: config.appName,
      version: '0.1.0',
      environment: config.env,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      status: isSystemHealthy ? 'healthy' : 'degraded',
      services: {
        database: dbHealth,
        redis: redisHealth,
      },
    };

    const statusCode = isSystemHealthy ? 200 : 503;
    return ApiResponse.success(res, healthData, `System health status: ${healthData.status}`, statusCode);
  } catch (error) {
    next(error);
  }
});

router.get('/ready', async (req, res, next) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    const redisHealth = await checkRedisHealth();

    const isReady = dbHealth.status === 'connected';

    const readinessData = {
      ready: isReady,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealth.status,
        redis: redisHealth.status,
      },
    };

    const statusCode = isReady ? 200 : 503;
    return ApiResponse.success(res, readinessData, `Readiness status: ${isReady ? 'READY' : 'NOT_READY'}`, statusCode);
  } catch (error) {
    next(error);
  }
});

export default router;
