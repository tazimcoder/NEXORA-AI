import { Router } from 'express';
import { integrationsController } from '../modules/integrations/integrations.controller.js';

const router = Router();

router.get('/providers', (req, res, next) => integrationsController.getProviders(req, res, next));
router.post('/test', (req, res, next) => integrationsController.testConnection(req, res, next));
router.post('/execute', (req, res, next) => integrationsController.executeAction(req, res, next));

export default router;
