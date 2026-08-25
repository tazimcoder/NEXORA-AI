import { getDbPool } from '../../config/db.config.js';
import crypto from 'crypto';

export class WorkflowsRepository {
  async create({ workspaceId, name, description, createdBy, definition }) {
    const pool = getDbPool();
    const id = crypto.randomUUID();
    const defaultDefinition = definition || { nodes: [], edges: [] };

    await pool.query(
      `INSERT INTO workflows 
       (id, workspace_id, name, description, status, is_active, current_version, definition_json, created_by) 
       VALUES (?, ?, ?, ?, 'draft', FALSE, 1, ?, ?)`,
      [id, workspaceId, name, description || null, JSON.stringify(defaultDefinition), createdBy]
    );

    return this.findById(id, workspaceId);
  }

  async findById(id, workspaceId) {
    const pool = getDbPool();
    const [rows] = await pool.query(
      'SELECT * FROM workflows WHERE id = ? AND workspace_id = ?',
      [id, workspaceId]
    );
    return rows[0] || null;
  }

  async findByWorkspaceId(workspaceId) {
    const pool = getDbPool();
    const [rows] = await pool.query(
      'SELECT id, workspace_id, name, description, status, is_active, current_version, created_by, created_at, updated_at FROM workflows WHERE workspace_id = ? ORDER BY updated_at DESC',
      [workspaceId]
    );
    return rows;
  }

  async update(id, workspaceId, { name, description, definition }) {
    const pool = getDbPool();
    const existing = await this.findById(id, workspaceId);
    if (!existing) return null;

    const updatedName = name !== undefined ? name : existing.name;
    const updatedDesc = description !== undefined ? description : existing.description;
    const updatedDef = definition !== undefined ? JSON.stringify(definition) : JSON.stringify(existing.definition_json);

    await pool.query(
      `UPDATE workflows 
       SET name = ?, description = ?, definition_json = ? 
       WHERE id = ? AND workspace_id = ?`,
      [updatedName, updatedDesc, updatedDef, id, workspaceId]
    );

    return this.findById(id, workspaceId);
  }

  async updateStatus(id, workspaceId, status, isActive) {
    const pool = getDbPool();
    await pool.query(
      'UPDATE workflows SET status = ?, is_active = ? WHERE id = ? AND workspace_id = ?',
      [status, isActive ? 1 : 0, id, workspaceId]
    );
    return this.findById(id, workspaceId);
  }

  async createVersionSnapshot(workflow, createdBy) {
    const pool = getDbPool();
    const versionId = crypto.randomUUID();
    const nextVersion = (workflow.current_version || 1) + 1;

    // 1. Insert snapshot into workflow_versions
    await pool.query(
      `INSERT INTO workflow_versions 
       (id, workflow_id, version, name, description, definition_json, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        versionId,
        workflow.id,
        workflow.current_version,
        workflow.name,
        workflow.description,
        JSON.stringify(workflow.definition_json),
        createdBy,
      ]
    );

    // 2. Increment current_version and set status to published
    await pool.query(
      'UPDATE workflows SET current_version = ?, status = \'published\', is_active = TRUE WHERE id = ?',
      [nextVersion, workflow.id]
    );

    return this.findById(workflow.id, workflow.workspace_id);
  }

  async findVersions(workflowId) {
    const pool = getDbPool();
    const [rows] = await pool.query(
      'SELECT id, workflow_id, version, name, description, created_by, created_at FROM workflow_versions WHERE workflow_id = ? ORDER BY version DESC',
      [workflowId]
    );
    return rows;
  }

  async delete(id, workspaceId) {
    const pool = getDbPool();
    await pool.query('DELETE FROM workflows WHERE id = ? AND workspace_id = ?', [id, workspaceId]);
    return true;
  }
}

export const workflowsRepository = new WorkflowsRepository();
