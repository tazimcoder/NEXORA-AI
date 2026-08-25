import { aiPlannerService } from './ai-planner.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AIPlannerController {
  async generatePlan(req, res, next) {
    try {
      const { prompt } = req.body;
      const proposal = await aiPlannerService.generatePlan(prompt);
      return ApiResponse.success(res, proposal, 'AI Automation proposal generated and validated');
    } catch (error) {
      next(error);
    }
  }

  async approvePlan(req, res, next) {
    try {
      const { name, description, definition } = req.body;
      const createdWorkflow = await aiPlannerService.approvePlan(req.workspaceId, req.user.id, {
        name,
        description,
        definition,
      });
      return ApiResponse.created(res, createdWorkflow, 'AI Proposal approved and workflow created');
    } catch (error) {
      next(error);
    }
  }
}

export const aiPlannerController = new AIPlannerController();
