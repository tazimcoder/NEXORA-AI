import { Router } from 'express';
import { executionsController } from '../modules/executions/executions.controller.js';

const router = Router();

// Public webhook route: POST /api/v1/webhooks/catch/:workspaceId/:workflowId
router.all('/catch/:workspaceId/:workflowId', (req, res, next) => executionsController.catchWebhook(req, res, next));

export default router;
