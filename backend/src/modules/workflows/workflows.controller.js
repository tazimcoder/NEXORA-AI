import { workflowsService } from './workflows.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class WorkflowsController {
  async getWorkflows(req, res, next) {
    try {
      const list = await workflowsService.getWorkspaceWorkflows(req.workspaceId);
      return ApiResponse.success(res, list, 'Workflows retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createWorkflow(req, res, next) {
    try {
      const { name, description, definition } = req.body;
      const workflow = await workflowsService.createWorkflow(req.workspaceId, req.user.id, {
        name,
        description,
        definition,
      });
      return ApiResponse.created(res, workflow, 'Workflow created successfully');
    } catch (error) {
      next(error);
    }
  }

  async getWorkflowById(req, res, next) {
    try {
      const workflow = await workflowsService.getWorkflowById(req.params.id, req.workspaceId);
      return ApiResponse.success(res, workflow, 'Workflow details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateWorkflow(req, res, next) {
    try {
      const { name, description, definition } = req.body;
      const updated = await workflowsService.updateWorkflow(req.params.id, req.workspaceId, {
        name,
        description,
        definition,
      });
      return ApiResponse.success(res, updated, 'Workflow updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async publishWorkflow(req, res, next) {
    try {
      const published = await workflowsService.publishWorkflow(req.params.id, req.workspaceId, req.user.id);
      return ApiResponse.success(res, published, 'Workflow graph published successfully');
    } catch (error) {
      next(error);
    }
  }

  async pauseWorkflow(req, res, next) {
    try {
      const paused = await workflowsService.pauseWorkflow(req.params.id, req.workspaceId);
      return ApiResponse.success(res, paused, 'Workflow paused');
    } catch (error) {
      next(error);
    }
  }

  async draftWorkflow(req, res, next) {
    try {
      const draft = await workflowsService.draftWorkflow(req.params.id, req.workspaceId);
      return ApiResponse.success(res, draft, 'Workflow reverted to draft');
    } catch (error) {
      next(error);
    }
  }

  async getVersions(req, res, next) {
    try {
      const versions = await workflowsService.getWorkflowVersions(req.params.id, req.workspaceId);
      return ApiResponse.success(res, versions, 'Workflow versions retrieved');
    } catch (error) {
      next(error);
    }
  }

  async validateWorkflow(req, res, next) {
    try {
      const result = await workflowsService.validateWorkflow(req.params.id, req.workspaceId);
      return ApiResponse.success(res, result, result.isValid ? 'Workflow graph is valid' : 'Validation issues detected');
    } catch (error) {
      next(error);
    }
  }

  async deleteWorkflow(req, res, next) {
    try {
      await workflowsService.deleteWorkflow(req.params.id, req.workspaceId);
      return ApiResponse.success(res, { deleted: true }, 'Workflow deleted');
    } catch (error) {
      next(error);
    }
  }
}

export const workflowsController = new WorkflowsController();
