import { workspacesService } from './workspaces.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class WorkspacesController {
  async getWorkspaces(req, res, next) {
    try {
      const workspaces = await workspacesService.getUserWorkspaces(req.user.id);
      return ApiResponse.success(res, workspaces, 'Workspaces retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createWorkspace(req, res, next) {
    try {
      const { name } = req.body;
      const workspace = await workspacesService.createWorkspace(req.user.id, { name });
      return ApiResponse.created(res, workspace, 'Workspace created successfully');
    } catch (error) {
      next(error);
    }
  }

  async getWorkspaceById(req, res, next) {
    try {
      const workspace = await workspacesService.getWorkspaceById(req.params.id, req.user.id);
      return ApiResponse.success(res, workspace, 'Workspace details retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const workspacesController = new WorkspacesController();
