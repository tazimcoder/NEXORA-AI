import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiError } from './utils/apiError.js';
import healthRoutes from './routes/health.routes.js';
import integrationsRoutes from './routes/integrations.routes.js';
import authRoutes from './routes/auth.routes.js';
import workspacesRoutes from './routes/workspaces.routes.js';
import usersRoutes from './routes/users.routes.js';
import workflowsRoutes from './routes/workflows.routes.js';
import executionsRoutes from './routes/executions.routes.js';
import webhooksRoutes from './routes/webhooks.routes.js';
import queueRoutes from './routes/queue.routes.js';
import aiRoutes from './routes/ai.routes.js';
import approvalsRoutes from './routes/approvals.routes.js';
import agentsRoutes from './routes/agents.routes.js';
import adminRoutes from './routes/admin.routes.js';

import { globalRateLimiter, authRateLimiter } from './middleware/rateLimit.middleware.js';
import { sanitizeInputMiddleware } from './middleware/sanitization.middleware.js';

const app = express();

// Security HTTP headers (Helmet)
app.use(helmet());

// Hardened CORS configuration
app.use(
  cors({
    origin: config.corsOrigin || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id', 'x-signature', 'x-hub-signature-256'],
    credentials: true,
  })
);

// Body Parsers & Input Sanitization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInputMiddleware);

// Request logging middleware
app.use(requestLogger);

// Global Rate Limiting
app.use('/api/', globalRateLimiter);
app.use('/api/v1/auth', authRateLimiter);


// API Routes
app.use('/api/v1', healthRoutes);
app.use('/api/v1/integrations', integrationsRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspacesRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/workflows', workflowsRoutes);
app.use('/api/v1/executions', executionsRoutes);
app.use('/api/v1/webhooks', webhooksRoutes);
app.use('/api/v1/queue', queueRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/approvals', approvalsRoutes);
app.use('/api/v1/agents', agentsRoutes);
app.use('/api/v1/admin', adminRoutes);



// Root greeting endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to NEXORA AI Execution Engine API',
    docs: '/api/v1/health',
  });
});

// Handle 404 for unknown endpoints
app.use((req, res, next) => {
  next(ApiError.notFound(`Endpoint not found: ${req.method} ${req.originalUrl}`));
});

// Centralized error handling middleware
app.use(errorHandler);

export default app;
