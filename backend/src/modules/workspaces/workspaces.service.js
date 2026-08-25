import { workspacesRepository } from './workspaces.repository.js';
import { ApiError } from '../../utils/apiError.js';

export class WorkspacesService {
  async getUserWorkspaces(userId) {
    return await workspacesRepository.findWorkspacesByUserId(userId);
  }

  async createWorkspace(userId, { name }) {
    if (!name || name.trim().length === 0) {
      throw ApiError.badRequest('Workspace name is required');
    }
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
    return await workspacesRepository.createWorkspace({
      name: name.trim(),
      slug,
      ownerId: userId,
    });
  }

  async getWorkspaceById(workspaceId, userId) {
    const workspace = await workspacesRepository.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }
    const role = await workspacesRepository.getMemberRole(workspaceId, userId);
    return { ...workspace, userRole: role };
  }
}

export const workspacesService = new WorkspacesService();
