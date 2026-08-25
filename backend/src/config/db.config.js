import mysql from 'mysql2/promise';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

let dbPool = null;

const runMigrations = async (pool) => {
  try {
    // Migration 001: Auth & Workspaces
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        owner_id VARCHAR(36) NOT NULL,
        settings_json JSON NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_workspaces_slug (slug),
        INDEX idx_workspaces_owner (owner_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS workspace_members (
        id VARCHAR(36) PRIMARY KEY,
        workspace_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        role ENUM('owner', 'admin', 'editor', 'viewer') NOT NULL DEFAULT 'editor',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uq_workspace_user (workspace_id, user_id),
        INDEX idx_members_workspace (workspace_id),
        INDEX idx_members_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Migration 002: Workflows, Executions, Triggers, Execution Logs, Audit Logs & Notifications
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workflows (
        id VARCHAR(36) PRIMARY KEY,
        workspace_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        status ENUM('draft', 'published', 'paused') NOT NULL DEFAULT 'draft',
        is_active BOOLEAN DEFAULT FALSE,
        current_version INT DEFAULT 1,
        definition_json JSON NOT NULL,
        created_by VARCHAR(36) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_workflows_workspace (workspace_id),
        INDEX idx_workflows_status (status),
        INDEX idx_workflows_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure status column exists if table was created in earlier schema version
    try {
      await pool.query(`ALTER TABLE workflows ADD COLUMN status ENUM('draft', 'published', 'paused') NOT NULL DEFAULT 'draft';`);
    } catch {
      // Column already exists
    }

    // Migration 003: Workflow Versions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workflow_versions (
        id VARCHAR(36) PRIMARY KEY,
        workflow_id VARCHAR(36) NOT NULL,
        version INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        definition_json JSON NOT NULL,
        created_by VARCHAR(36) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uq_workflow_version (workflow_id, version),
        INDEX idx_versions_workflow (workflow_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS triggers (
        id VARCHAR(36) PRIMARY KEY,
        workflow_id VARCHAR(36) NOT NULL,
        type ENUM('webhook', 'cron', 'event') NOT NULL,
        config_json JSON NOT NULL,
        is_enabled BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
        INDEX idx_triggers_workflow (workflow_id),
        INDEX idx_triggers_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS executions (
        id VARCHAR(36) PRIMARY KEY,
        workflow_id VARCHAR(36) NOT NULL,
        workspace_id VARCHAR(36) NOT NULL,
        trigger_type VARCHAR(50) NOT NULL,
        status ENUM('pending', 'running', 'completed', 'failed', 'retrying') DEFAULT 'pending',
        error_message TEXT NULL,
        started_at DATETIME NULL,
        finished_at DATETIME NULL,
        metrics_json JSON NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        INDEX idx_executions_workflow (workflow_id),
        INDEX idx_executions_workspace (workspace_id),
        INDEX idx_executions_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS execution_logs (
        id VARCHAR(36) PRIMARY KEY,
        execution_id VARCHAR(36) NOT NULL,
        step_id VARCHAR(255) NOT NULL,
        node_name VARCHAR(255) NOT NULL,
        status ENUM('success', 'failed', 'running', 'skipped', 'recovery_diagnosed') NOT NULL,
        input_json JSON NULL,
        output_json JSON NULL,
        error_json JSON NULL,
        log_level ENUM('info', 'warn', 'error', 'debug') DEFAULT 'info',
        timestamp DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE,
        INDEX idx_logs_execution (execution_id),
        INDEX idx_logs_step (step_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    try {
      await pool.query(`ALTER TABLE execution_logs MODIFY COLUMN status ENUM('success', 'failed', 'running', 'skipped', 'recovery_diagnosed') NOT NULL;`);
    } catch {
      // Column already updated or table created with new ENUM
    }


    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        workspace_id VARCHAR(36) NULL,
        user_id VARCHAR(36) NULL,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100) NOT NULL,
        resource_id VARCHAR(36) NULL,
        metadata_json JSON NULL,
        ip_address VARCHAR(45) NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_workspace (workspace_id),
        INDEX idx_audit_user (user_id),
        INDEX idx_audit_action (action)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        workspace_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        type ENUM('execution_failure', 'system', 'approval_request') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_notifications_user (user_id),
        INDEX idx_notifications_read (is_read)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Migration 004: Multi-Agent Orchestration
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_orchestrations (
        id VARCHAR(36) PRIMARY KEY,
        workspace_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        task_description TEXT NOT NULL,
        status ENUM('queued', 'planning', 'executing', 'aggregating', 'reviewing', 'completed', 'failed') NOT NULL DEFAULT 'queued',
        result_json JSON NULL,
        metrics_json JSON NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_orchestrations_workspace (workspace_id),
        INDEX idx_orchestrations_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_tasks (
        id VARCHAR(36) PRIMARY KEY,
        orchestration_id VARCHAR(36) NOT NULL,
        agent_id VARCHAR(100) NOT NULL,
        task_type VARCHAR(100) NOT NULL,
        status ENUM('pending', 'running', 'completed', 'failed', 'awaiting_approval', 'timeout') NOT NULL DEFAULT 'pending',
        input_json JSON NULL,
        output_json JSON NULL,
        error_message TEXT NULL,
        execution_time_ms INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        finished_at DATETIME NULL,
        FOREIGN KEY (orchestration_id) REFERENCES agent_orchestrations(id) ON DELETE CASCADE,
        INDEX idx_agent_tasks_orchestration (orchestration_id),
        INDEX idx_agent_tasks_agent (agent_id),
        INDEX idx_agent_tasks_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_logs (
        id VARCHAR(36) PRIMARY KEY,
        orchestration_id VARCHAR(36) NOT NULL,
        task_id VARCHAR(36) NULL,
        agent_id VARCHAR(100) NOT NULL,
        log_level ENUM('info', 'warn', 'error', 'debug') DEFAULT 'info',
        message TEXT NOT NULL,
        metadata_json JSON NULL,
        created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        FOREIGN KEY (orchestration_id) REFERENCES agent_orchestrations(id) ON DELETE CASCADE,
        INDEX idx_agent_logs_orchestration (orchestration_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    logger.info('All database schema migrations (001 + 002 + 003 + 004) applied successfully');
  } catch (error) {
    logger.error('Error applying database migrations:', { message: error.message });
  }
};

export const initDatabase = async () => {
  try {
    // First, connect to MySQL server without selecting a DB to ensure DB exists
    const tempConnection = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
    });

    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\`;`);
    await tempConnection.end();

    // Now create pool connected to the target database
    dbPool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: config.db.connectionLimit,
      queueLimit: 0,
    });

    // Verify connectivity with simple query
    const [rows] = await dbPool.query('SELECT 1 + 1 AS solution');
    logger.info('MySQL connection established successfully', { solution: rows[0].solution });

    // Apply migrations
    await runMigrations(dbPool);

    return true;
  } catch (error) {
    logger.error('MySQL Connection Failure:', { message: error.message, code: error.code });
    return false;
  }
};

export const checkDatabaseHealth = async () => {
  if (!dbPool) {
    return { status: 'disconnected', message: 'Pool not initialized' };
  }
  try {
    const start = Date.now();
    await dbPool.query('SELECT 1');
    const latency = Date.now() - start;
    return { status: 'connected', latencyMs: latency };
  } catch (error) {
    logger.error('Database Healthcheck Failed:', { message: error.message });
    return { status: 'error', message: error.message };
  }
};

export const getDbPool = () => dbPool;

export const closeDbPool = async () => {
  if (dbPool) {
    try {
      await dbPool.end();
    } catch {
      // Ignore if already ended
    }
    dbPool = null;
  }
};

