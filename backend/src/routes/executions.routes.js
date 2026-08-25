import { Router } from 'express';
import { executionsController } from '../modules/executions/executions.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireWorkspaceRole } from '../middleware/tenant.middleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/run/:workflowId', requireWorkspaceRole('editor'), (req, res, next) => executionsController.executeWorkflow(req, res, next));
router.get('/', requireWorkspaceRole('viewer'), (req, res, next) => executionsController.getExecutions(req, res, next));
router.get('/:id', requireWorkspaceRole('viewer'), (req, res, next) => executionsController.getExecutionById(req, res, next));

export default router;
