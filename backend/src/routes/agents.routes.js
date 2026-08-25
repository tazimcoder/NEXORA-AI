import { Router } from 'express';
import { agentsController } from '../modules/agents/agents.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireWorkspaceRole } from '../middleware/tenant.middleware.js';

const router = Router();

// Apply Auth and Tenant protection to all Agent routes
router.use(authenticateToken);
router.use(requireWorkspaceRole('viewer'));



router.post('/orchestrate', (req, res, next) => agentsController.orchestrate(req, res, next));
router.get('/orchestrations', (req, res, next) => agentsController.listOrchestrations(req, res, next));
router.get('/orchestrations/:id', (req, res, next) => agentsController.getOrchestration(req, res, next));
router.get('/list', (req, res, next) => agentsController.listAgents(req, res, next));

export default router;
