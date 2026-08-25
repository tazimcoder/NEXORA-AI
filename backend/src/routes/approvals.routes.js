import { Router } from 'express';
import { approvalController } from '../modules/self-healing/approval.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireWorkspaceRole } from '../middleware/tenant.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requireWorkspaceRole('viewer'), (req, res, next) => approvalController.getPendingApprovals(req, res, next));
router.post('/:id/approve', requireWorkspaceRole('admin'), (req, res, next) => approvalController.approveRecovery(req, res, next));
router.post('/:id/reject', requireWorkspaceRole('admin'), (req, res, next) => approvalController.rejectRecovery(req, res, next));

export default router;
