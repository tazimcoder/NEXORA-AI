-- NEXORA AI Database Migration: 003_phase3_workflows_schema.sql

-- Ensure status column exists in workflows table
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS status ENUM('draft', 'published', 'paused') NOT NULL DEFAULT 'draft';

-- Create workflow_versions table for immutable version snapshots
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
