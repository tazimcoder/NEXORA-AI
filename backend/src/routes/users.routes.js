import { Router } from 'express';
import { usersController } from '../modules/users/users.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/profile', (req, res, next) => usersController.getProfile(req, res, next));
router.put('/profile', (req, res, next) => usersController.updateProfile(req, res, next));
router.put('/password', (req, res, next) => usersController.changePassword(req, res, next));

export default router;
