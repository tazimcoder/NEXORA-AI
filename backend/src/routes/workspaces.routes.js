import { Router } from 'express';
import { workspacesController } from '../modules/workspaces/workspaces.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireWorkspaceRole } from '../middleware/tenant.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', (req, res, next) => workspacesController.getWorkspaces(req, res, next));
router.post('/', (req, res, next) => workspacesController.createWorkspace(req, res, next));
router.get('/:id', requireWorkspaceRole('viewer'), (req, res, next) => workspacesController.getWorkspaceById(req, res, next));

export default router;
