import { adminService } from './admin.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AdminController {
  async getDashboard(req, res, next) {
    try {
      const data = await adminService.getDashboardOverview();
      return ApiResponse.success(res, data, 'Admin dashboard metrics overview retrieved');
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req, res, next) {
    try {
      const users = await adminService.listUsers();
      return ApiResponse.success(res, users, 'Users list retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { status, role } = req.body;
      const updated = await adminService.updateUser(id, { status, role });
      return ApiResponse.success(res, updated, 'User account controls updated');
    } catch (error) {
      next(error);
    }
  }

  async listWorkflows(req, res, next) {
    try {
      const workflows = await adminService.listWorkflows();
      return ApiResponse.success(res, workflows, 'Workflows monitoring overview retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getQueueMonitoring(req, res, next) {
    try {
      const queueData = await adminService.getQueueMonitoring();
      return ApiResponse.success(res, queueData, 'Queue monitoring status retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getWorkerMonitoring(req, res, next) {
    try {
      const workerData = await adminService.getWorkerMonitoring();
      return ApiResponse.success(res, workerData, 'Worker health monitoring retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getSystemLogs(req, res, next) {
    try {
      const logsData = await adminService.getSystemLogs();
      return ApiResponse.success(res, logsData, 'System audit & recovery logs retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getUserData(req, res, next) {
    try {
      const { id } = req.params;
      const data = await adminService.getUserData(id);
      return ApiResponse.success(res, data, 'User specific workflows & data telemetry retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
