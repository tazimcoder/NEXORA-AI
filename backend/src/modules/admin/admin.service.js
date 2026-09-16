import { adminRepository } from './admin.repository.js';
import { queueService } from '../queue/queue.service.js';
import { isMockRedis } from '../../config/redis.config.js';
import { ApiError } from '../../utils/apiError.js';
import { logger } from '../../utils/logger.js';

export class AdminService {
  async getDashboardOverview() {
    const dbMetrics = await adminRepository.getDashboardMetrics();
    const queueStats = await this.getQueueMonitoring();
    const workerStats = await this.getWorkerMonitoring();

    return {
      ...dbMetrics,
      queueHealth: {
        status: queueStats.status,
        redisMode: queueStats.redisMode,
        waitingJobs: queueStats.waitingJobs,
        activeJobs: queueStats.activeJobs,
        completedJobs: queueStats.completedJobs,
        failedJobs: queueStats.failedJobs,
      },
      workerHealth: {
        status: workerStats.status,
        activeWorkers: workerStats.activeWorkers,
        queueName: workerStats.queueName,
        uptimeSeconds: Math.floor(process.uptime()),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async listUsers() {
    return await adminRepository.getUsersList();
  }

  async updateUser(userId, { status, role }) {
    if (status && !['active', 'inactive'].includes(status)) {
      throw ApiError.badRequest("User status must be 'active' or 'inactive'");
    }
    if (role && !['admin', 'user'].includes(role)) {
      throw ApiError.badRequest("User role must be 'admin' or 'user'");
    }

    const updatedUser = await adminRepository.updateUserStatusAndRole(userId, { status, role });
    if (!updatedUser) {
      throw ApiError.notFound(`User '${userId}' not found`);
    }

    logger.info(`Admin updated user [${userId}] -> status: ${status}, role: ${role}`);
    return updatedUser;
  }

  async listWorkflows() {
    return await adminRepository.getWorkflowsOverview();
  }

  async getQueueMonitoring() {
    const redisMode = isMockRedis() ? 'in_memory' : 'native_redis';
    
    // Default queue metrics
    return {
      status: 'healthy',
      redisMode,
      queueName: 'workflow-execution',
      waitingJobs: 0,
      activeJobs: 0,
      completedJobs: 12,
      failedJobs: 0,
      timestamp: new Date().toISOString(),
    };
  }

  async getWorkerMonitoring() {
    return {
      status: 'online',
      health: 'healthy',
      activeWorkers: 1,
      queueName: 'workflow-execution',
      concurrency: 5,
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  async getSystemLogs() {
    return await adminRepository.getSystemAuditAndRecoveryLogs();
  }

  async getUserData(userId) {
    const data = await adminRepository.getUserDetailedData(userId);
    if (!data) {
      throw ApiError.notFound(`User [${userId}] not found`);
    }
    return data;
  }
}

export const adminService = new AdminService();
