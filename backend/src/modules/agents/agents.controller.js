import { agentsService } from './agents.service.js';
import { agentRegistry } from './agent.registry.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AgentsController {
  async orchestrate(req, res, next) {
    try {
      const { prompt, options } = req.body;
      const workspaceId = req.workspaceId;
      const userId = req.user.id;

      const result = await agentsService.orchestrateTask(workspaceId, userId, prompt, options || {});
      return ApiResponse.success(res, result, 'Multi-agent task orchestration started successfully');
    } catch (error) {
      next(error);
    }
  }

  async getOrchestration(req, res, next) {
    try {
      const { id } = req.params;
      const workspaceId = req.workspaceId;

      const details = await agentsService.getOrchestrationById(id, workspaceId);
      return ApiResponse.success(res, details, 'Orchestration details and sub-task logs retrieved');
    } catch (error) {
      next(error);
    }
  }

  async listOrchestrations(req, res, next) {
    try {
      const workspaceId = req.workspaceId;
      const list = await agentsService.listWorkspaceOrchestrations(workspaceId);
      return ApiResponse.success(res, list, 'Workspace orchestrations list retrieved');
    } catch (error) {
      next(error);
    }
  }

  async listAgents(req, res, next) {
    try {
      const list = agentRegistry.listAgents();
      return ApiResponse.success(res, list, 'Registered specialized agents list retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const agentsController = new AgentsController();
