import http from 'http';
import { initDatabase, checkDatabaseHealth } from '../src/config/db.config.js';
import { initRedis, checkRedisHealth } from '../src/config/redis.config.js';
import app from '../src/app.js';
import { config } from '../src/config/index.js';
import { logger } from '../src/utils/logger.js';

const runVerification = async () => {
  logger.info('--- NEXORA AI Phase 1 Automated Verification ---');

  // 1. Check MySQL
  logger.info('[1/3] Testing MySQL Database Layer...');
  await initDatabase();
  const dbHealth = await checkDatabaseHealth();
  logger.info(`MySQL Status: ${dbHealth.status} (Latency: ${dbHealth.latencyMs || 0}ms)`);

  // 2. Check Redis
  logger.info('[2/3] Testing Redis Layer...');
  await initRedis();
  const redisHealth = await checkRedisHealth();
  logger.info(`Redis Status: ${redisHealth.status} (${redisHealth.type || 'N/A'}, Latency: ${redisHealth.latencyMs || 0}ms)`);

  // 3. Test Express Server Health Endpoint
  logger.info('[3/3] Testing Express Server & HTTP Health Endpoint...');
  const server = app.listen(0, async () => {
    const port = server.address().port;
    logger.info(`Verification test server running on port ${port}`);

    http.get(`http://localhost:${port}/api/v1/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        logger.info(`HTTP GET /api/v1/health Status Code: ${res.statusCode}`);
        logger.info(`Response Payload: ${data}`);
        server.close();
        process.exit(0);
      });
    }).on('error', (err) => {
      logger.error('Health endpoint request failed:', { message: err.message });
      server.close();
      process.exit(1);
    });
  });
};

runVerification();
