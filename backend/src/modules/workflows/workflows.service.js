import { workflowsRepository } from './workflows.repository.js';
import { validateWorkflowGraph } from './workflows.validator.js';
import { ApiError } from '../../utils/apiError.js';
import { logger } from '../../utils/logger.js';

export class WorkflowsService {
  async getWorkspaceWorkflows(workspaceId) {
    return await workflowsRepository.findByWorkspaceId(workspaceId);
  }

  async createWorkflow(workspaceId, userId, { name, description, definition }) {
    if (!name || name.trim().length === 0) {
      throw ApiError.badRequest('Workflow name is required');
    }
    const workflow = await workflowsRepository.create({
      workspaceId,
      name: name.trim(),
      description,
      createdBy: userId,
      definition,
    });
    logger.info(`Workflow created: [${workflow.name}] (${workflow.id}) in workspace [${workspaceId}]`);
    return workflow;
  }

  async getWorkflowById(workflowId, workspaceId) {
    const workflow = await workflowsRepository.findById(workflowId, workspaceId);
    if (!workflow) {
      throw ApiError.notFound('Workflow blueprint not found');
    }
    return workflow;
  }

  async updateWorkflow(workflowId, workspaceId, { name, description, definition }) {
    const existing = await this.getWorkflowById(workflowId, workspaceId);
    const updated = await workflowsRepository.update(workflowId, workspaceId, {
      name,
      description,
      definition,
    });
    logger.info(`Workflow updated: [${updated.name}] (${workflowId})`);
    return updated;
  }

  async publishWorkflow(workflowId, workspaceId, userId) {
    const workflow = await this.getWorkflowById(workflowId, workspaceId);

    // Validate Graph AST before publishing
    const validation = validateWorkflowGraph(workflow.definition_json);
    if (!validation.isValid) {
      throw ApiError.badRequest(
        'Cannot publish invalid workflow graph',
        'WORKFLOW_VALIDATION_FAILED',
        validation.errors
      );
    }

    const published = await workflowsRepository.createVersionSnapshot(workflow, userId);
    logger.info(`Workflow published: [${published.name}] version ${published.current_version - 1}`);
    return published;
  }

  async pauseWorkflow(workflowId, workspaceId) {
    await this.getWorkflowById(workflowId, workspaceId);
    const paused = await workflowsRepository.updateStatus(workflowId, workspaceId, 'paused', false);
    logger.info(`Workflow paused: [${paused.name}] (${workflowId})`);
    return paused;
  }

  async draftWorkflow(workflowId, workspaceId) {
    await this.getWorkflowById(workflowId, workspaceId);
    const draft = await workflowsRepository.updateStatus(workflowId, workspaceId, 'draft', false);
    logger.info(`Workflow set to draft: [${draft.name}] (${workflowId})`);
    return draft;
  }

  async getWorkflowVersions(workflowId, workspaceId) {
    await this.getWorkflowById(workflowId, workspaceId);
    return await workflowsRepository.findVersions(workflowId);
  }

  async validateWorkflow(workflowId, workspaceId) {
    const workflow = await this.getWorkflowById(workflowId, workspaceId);
    return validateWorkflowGraph(workflow.definition_json);
  }

  async deleteWorkflow(workflowId, workspaceId) {
    await this.getWorkflowById(workflowId, workspaceId);
    await workflowsRepository.delete(workflowId, workspaceId);
    logger.info(`Workflow deleted: (${workflowId})`);
    return true;
  }
}

export const workflowsService = new WorkflowsService();
