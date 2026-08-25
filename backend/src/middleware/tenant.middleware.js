import { workspacesRepository } from '../modules/workspaces/workspaces.repository.js';
import { ApiError } from '../utils/apiError.js';

const ROLE_HIERARCHY = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

export const requireWorkspaceRole = (minRequiredRole = 'viewer') => {
  return async (req, res, next) => {
    try {
      const workspaceId = req.headers['x-workspace-id'] || req.params.workspaceId || req.query.workspaceId;
      if (!workspaceId) {
        return next(ApiError.badRequest('x-workspace-id header or parameter is required for workspace operations'));
      }

      if (!req.user || !req.user.id) {
        return next(ApiError.unauthorized('User authentication context is missing'));
      }

      const role = await workspacesRepository.getMemberRole(workspaceId, req.user.id);
      if (!role) {
        return next(ApiError.forbidden('Access denied. You are not a member of this workspace', 'NOT_WORKSPACE_MEMBER'));
      }

      const userRoleLevel = ROLE_HIERARCHY[role] || 0;
      const requiredRoleLevel = ROLE_HIERARCHY[minRequiredRole] || 1;

      if (userRoleLevel < requiredRoleLevel) {
        return next(ApiError.forbidden(`Requires minimum '${minRequiredRole}' role in this workspace`, 'INSUFFICIENT_PERMISSIONS'));
      }

      req.workspaceId = workspaceId;
      req.userWorkspaceRole = role;
      next();
    } catch (error) {
      next(error);
    }
  };
};
