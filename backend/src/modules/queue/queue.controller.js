import { queueService } from './queue.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class QueueController {
  async getQueueStatus(req, res, next) {
    try {
      const metrics = await queueService.getQueueMetrics();
      return ApiResponse.success(res, metrics, 'BullMQ queue metrics retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getJobStatus(req, res, next) {
    try {
      const { id } = req.params;
      const status = await queueService.getJobStatus(id);
      return ApiResponse.success(res, status, 'BullMQ job status retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const queueController = new QueueController();
