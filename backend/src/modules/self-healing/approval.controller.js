import { approvalService } from './approval.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class ApprovalController {
  async getPendingApprovals(req, res, next) {
    try {
      const list = await approvalService.getPendingApprovals(req.workspaceId);
      return ApiResponse.success(res, list, 'Pending approval requests retrieved');
    } catch (error) {
      next(error);
    }
  }

  async approveRecovery(req, res, next) {
    try {
      const { id } = req.params;
      const result = await approvalService.approveRecovery(id, req.workspaceId, req.user.id);
      return ApiResponse.success(res, result, 'Recovery action approved');
    } catch (error) {
      next(error);
    }
  }

  async rejectRecovery(req, res, next) {
    try {
      const { id } = req.params;
      const result = await approvalService.rejectRecovery(id, req.workspaceId, req.user.id);
      return ApiResponse.success(res, result, 'Recovery action rejected');
    } catch (error) {
      next(error);
    }
  }
}

export const approvalController = new ApprovalController();
