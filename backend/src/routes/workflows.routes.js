import { Router } from 'express';
import { workflowsController } from '../modules/workflows/workflows.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireWorkspaceRole } from '../middleware/tenant.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { CreateWorkflowSchema, UpdateWorkflowSchema } from '../modules/workflows/workflows.schema.js';

const router = Router();

// Protect all workflow routes with authentication & workspace role checks
router.use(authenticateToken);

router.get('/', requireWorkspaceRole('viewer'), (req, res, next) => workflowsController.getWorkflows(req, res, next));
router.post('/', requireWorkspaceRole('editor'), validateRequest(CreateWorkflowSchema), (req, res, next) => workflowsController.createWorkflow(req, res, next));
router.get('/:id', requireWorkspaceRole('viewer'), (req, res, next) => workflowsController.getWorkflowById(req, res, next));
router.put('/:id', requireWorkspaceRole('editor'), validateRequest(UpdateWorkflowSchema), (req, res, next) => workflowsController.updateWorkflow(req, res, next));
router.delete('/:id', requireWorkspaceRole('admin'), (req, res, next) => workflowsController.deleteWorkflow(req, res, next));

// State Machine Actions
router.post('/:id/publish', requireWorkspaceRole('admin'), (req, res, next) => workflowsController.publishWorkflow(req, res, next));
router.post('/:id/pause', requireWorkspaceRole('editor'), (req, res, next) => workflowsController.pauseWorkflow(req, res, next));
router.post('/:id/draft', requireWorkspaceRole('editor'), (req, res, next) => workflowsController.draftWorkflow(req, res, next));

// Versions & Validation
router.get('/:id/versions', requireWorkspaceRole('viewer'), (req, res, next) => workflowsController.getVersions(req, res, next));
router.post('/:id/validate', requireWorkspaceRole('viewer'), (req, res, next) => workflowsController.validateWorkflow(req, res, next));

export default router;
