import { Router } from 'express';
import { adminController } from '../modules/admin/admin.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

// Protect ALL Admin endpoints: Authentication Token + Role 'admin' Required
router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/dashboard', (req, res, next) => adminController.getDashboard(req, res, next));
router.get('/users', (req, res, next) => adminController.listUsers(req, res, next));
router.patch('/users/:id', (req, res, next) => adminController.updateUser(req, res, next));
router.get('/workflows', (req, res, next) => adminController.listWorkflows(req, res, next));
router.get('/queue', (req, res, next) => adminController.getQueueMonitoring(req, res, next));
router.get('/worker', (req, res, next) => adminController.getWorkerMonitoring(req, res, next));
router.get('/system-logs', (req, res, next) => adminController.getSystemLogs(req, res, next));

export default router;
