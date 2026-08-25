import { Router } from 'express';
import { queueController } from '../modules/queue/queue.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireWorkspaceRole } from '../middleware/tenant.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/status', requireWorkspaceRole('viewer'), (req, res, next) => queueController.getQueueStatus(req, res, next));
router.get('/jobs/:id', requireWorkspaceRole('viewer'), (req, res, next) => queueController.getJobStatus(req, res, next));

export default router;
