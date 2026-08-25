import { Router } from 'express';
import { authController } from '../modules/auth/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from '../modules/auth/auth.schema.js';

const router = Router();

router.post('/register', validateRequest(RegisterSchema), (req, res, next) => authController.register(req, res, next));
router.post('/login', validateRequest(LoginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/refresh', validateRequest(RefreshTokenSchema), (req, res, next) => authController.refresh(req, res, next));
router.post('/logout', authenticateToken, (req, res, next) => authController.logout(req, res, next));
router.get('/me', authenticateToken, (req, res, next) => authController.getMe(req, res, next));

export default router;
