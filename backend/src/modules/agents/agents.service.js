import { agentOrchestrator } from './agent.orchestrator.js';
import { agentsRepository } from './agents.repository.js';
import { ApiError } from '../../utils/apiError.js';
import { logger } from '../../utils/logger.js';

export class AgentsService {
  async orchestrateTask(workspaceId, userId, prompt, options = {}) {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      throw ApiError.badRequest('Prompt task description must be at least 3 characters long');
    }

    return await agentOrchestrator.orchestrate(prompt.trim(), workspaceId, userId, options);
  }

  async getOrchestrationById(orchestrationId, workspaceId) {
    const data = await agentsRepository.getOrchestrationById(orchestrationId);
    if (!data) {
      throw ApiError.notFound(`Orchestration task '${orchestrationId}' not found`);
    }
    if (data.workspace_id !== workspaceId) {
      throw ApiError.forbidden('Access denied to orchestration in another workspace');
    }
    return data;
  }

  async listWorkspaceOrchestrations(workspaceId) {
    return await agentsRepository.getWorkspaceOrchestrations(workspaceId);
  }
}

export const agentsService = new AgentsService();
