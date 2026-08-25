import { aiPlannerRegistry } from './ai-planner.registry.js';
import { validateAIProposal } from './ai-planner.validator.js';
import { translateProposalToDefinition } from './ai-planner.translator.js';
import { workflowsService } from '../workflows/workflows.service.js';
import { ApiError } from '../../utils/apiError.js';
import { logger } from '../../utils/logger.js';

export class AIPlannerService {
  async generatePlan(prompt) {
    if (!prompt || prompt.trim().length < 5) {
      throw ApiError.badRequest('Prompt must be at least 5 characters long');
    }

    const provider = aiPlannerRegistry.getActiveProvider();
    logger.info(`Invoking AI Planner Provider [${provider.name}] for prompt: "${prompt}"`);

    // 1. Generate Raw Proposal JSON
    const rawProposal = await provider.generatePlan(prompt.trim());

    // 2. Validate Proposal JSON & Graph AST
    const validation = validateAIProposal(rawProposal);
    if (!validation.isValid) {
      logger.warn('AI generated proposal failed validation:', { errors: validation.errors });
      throw ApiError.badRequest(
        'AI generated proposal failed validation',
        'AI_PROPOSAL_INVALID',
        validation.errors
      );
    }

    // 3. Translate Proposal to NEXORA Workflow Definition
    const preview = translateProposalToDefinition(validation.plan);

    return {
      isValid: true,
      previewPlan: {
        title: preview.title,
        description: preview.description,
        nodeCount: preview.definition.nodes.length,
        edgeCount: preview.definition.edges.length,
      },
      workflowProposal: {
        name: preview.title,
        description: preview.description,
        definition: preview.definition,
      },
    };
  }

  async approvePlan(workspaceId, userId, { name, description, definition }) {
    logger.info(`User approved AI Proposal workflow: [${name}] in workspace [${workspaceId}]`);
    return await workflowsService.createWorkflow(workspaceId, userId, {
      name,
      description,
      definition,
    });
  }
}

export const aiPlannerService = new AIPlannerService();
