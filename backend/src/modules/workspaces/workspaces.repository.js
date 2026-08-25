import { getDbPool } from '../../config/db.config.js';
import crypto from 'crypto';

export class WorkspacesRepository {
  async createWorkspace({ name, slug, ownerId, settings = {} }) {
    const pool = getDbPool();
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO workspaces (id, name, slug, owner_id, settings_json) VALUES (?, ?, ?, ?, ?)',
      [id, name, slug, ownerId, JSON.stringify(settings)]
    );

    // Automatically add owner to workspace_members with 'owner' role
    const memberId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES (?, ?, ?, ?)',
      [memberId, id, ownerId, 'owner']
    );

    return this.findWorkspaceById(id);
  }

  async findWorkspaceById(id) {
    const pool = getDbPool();
    const [rows] = await pool.query('SELECT * FROM workspaces WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findWorkspacesByUserId(userId) {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT w.*, wm.role as member_role 
       FROM workspaces w 
       JOIN workspace_members wm ON w.id = wm.workspace_id 
       WHERE wm.user_id = ?`,
      [userId]
    );
    return rows;
  }

  async getMemberRole(workspaceId, userId) {
    const pool = getDbPool();
    const [rows] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [workspaceId, userId]
    );
    return rows[0]?.role || null;
  }
}

export const workspacesRepository = new WorkspacesRepository();
