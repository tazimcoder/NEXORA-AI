-- NEXORA AI Database Migration: 002_workflows_executions_queues.sql

CREATE TABLE IF NOT EXISTS workflows (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  current_version INT DEFAULT 1,
  definition_json JSON NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_workflows_workspace (workspace_id),
  INDEX idx_workflows_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS execution_logs (
  id VARCHAR(36) PRIMARY KEY,
  execution_id VARCHAR(36) NOT NULL,
  step_id VARCHAR(255) NOT NULL,
  node_name VARCHAR(255) NOT NULL,
  status ENUM('success', 'failed', 'running', 'skipped') NOT NULL,
  input_json JSON NULL,
  output_json JSON NULL,
  error_json JSON NULL,
  log_level ENUM('info', 'warn', 'error', 'debug') DEFAULT 'info',
  timestamp DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE,
  INDEX idx_logs_execution (execution_id),
  INDEX idx_logs_step (step_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
