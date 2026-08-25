import { executionsService } from './executions.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class ExecutionsController {
  async executeWorkflow(req, res, next) {
    try {
      const { workflowId } = req.params;
      const payload = req.body || {};
      const result = await executionsService.executeWorkflow(workflowId, req.workspaceId, req.user.id, payload);
      return res.status(202).json({
        success: true,
        message: 'Workflow execution job queued successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getExecutions(req, res, next) {
    try {
      const list = await executionsService.getWorkspaceExecutions(req.workspaceId);
      return ApiResponse.success(res, list, 'Executions list retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getExecutionById(req, res, next) {
    try {
      const { id } = req.params;
      const details = await executionsService.getExecutionById(id, req.workspaceId);
      return ApiResponse.success(res, details, 'Execution details and logs retrieved');
    } catch (error) {
      next(error);
    }
  }

  async catchWebhook(req, res, next) {
    try {
      const { workflowId, workspaceId } = req.params;
      const triggerPayload = {
        method: req.method,
        headers: req.headers,
        query: req.query,
        body: req.body,
      };

      const result = await executionsService.executeWebhookTrigger(workflowId, workspaceId, triggerPayload);
      return res.status(202).json({
        success: true,
        message: 'Webhook trigger queued for asynchronous execution',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const executionsController = new ExecutionsController();
