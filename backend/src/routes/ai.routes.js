import { Router } from 'express';
import { aiPlannerController } from '../modules/ai/ai-planner.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireWorkspaceRole } from '../middleware/tenant.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { GeneratePlanPromptSchema, ApprovePlanSchema } from '../modules/ai/ai-planner.schema.js';

const router = Router();

router.use(authenticateToken);

router.post('/generate-plan', requireWorkspaceRole('editor'), validateRequest(GeneratePlanPromptSchema), (req, res, next) => aiPlannerController.generatePlan(req, res, next));
router.post('/approve-plan', requireWorkspaceRole('editor'), validateRequest(ApprovePlanSchema), (req, res, next) => aiPlannerController.approvePlan(req, res, next));

export default router;
