import { getDbPool } from '../../config/db.config.js';

export class AdminRepository {
  async getDashboardMetrics() {
    const pool = getDbPool();

    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ activeWorkflows }]] = await pool.query("SELECT COUNT(*) AS activeWorkflows FROM workflows WHERE status = 'published' OR is_active = TRUE");
    const [[{ runningExecutions }]] = await pool.query("SELECT COUNT(*) AS runningExecutions FROM executions WHERE status = 'running'");
    const [[{ successfulExecutions }]] = await pool.query("SELECT COUNT(*) AS successfulExecutions FROM executions WHERE status = 'completed'");
    const [[{ failedExecutions }]] = await pool.query("SELECT COUNT(*) AS failedExecutions FROM executions WHERE status = 'failed'");
    const [[{ totalWorkflows }]] = await pool.query('SELECT COUNT(*) AS totalWorkflows FROM workflows');
    const [[{ totalExecutions }]] = await pool.query('SELECT COUNT(*) AS totalExecutions FROM executions');

    return {
      totalUsers: Number(totalUsers || 0),
      activeWorkflows: Number(activeWorkflows || 0),
      totalWorkflows: Number(totalWorkflows || 0),
      runningExecutions: Number(runningExecutions || 0),
      successfulExecutions: Number(successfulExecutions || 0),
      failedExecutions: Number(failedExecutions || 0),
      totalExecutions: Number(totalExecutions || 0),
    };
  }

  async getUsersList() {
    const pool = getDbPool();
    const [rows] = await pool.query(
      'SELECT id, email, name, role, status, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  }

  async updateUserStatusAndRole(userId, { status, role }) {
    const pool = getDbPool();
    await pool.query(
      'UPDATE users SET status = COALESCE(?, status), role = COALESCE(?, role) WHERE id = ?',
      [status || null, role || null, userId]
    );
    const [rows] = await pool.query('SELECT id, email, name, role, status FROM users WHERE id = ?', [userId]);
    return rows[0];
  }

  async getWorkflowsOverview() {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT w.id, w.workspace_id, w.name, w.description, w.status, w.is_active, w.current_version, w.created_at, w.updated_at, u.email as creator_email 
       FROM workflows w 
       LEFT JOIN users u ON w.created_by = u.id 
       ORDER BY w.updated_at DESC`
    );
    return rows;
  }

  async getSystemAuditAndRecoveryLogs() {
    const pool = getDbPool();
    const [auditLogs] = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50');
    const [recoveryEvents] = await pool.query(
      "SELECT * FROM execution_logs WHERE status = 'recovery_diagnosed' ORDER BY timestamp DESC LIMIT 50"
    );
    const [systemNotifications] = await pool.query(
      "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50"
    );

    return {
      auditLogs,
      recoveryEvents,
      systemNotifications,
    };
  }

  async getUserDetailedData(userId) {
    const pool = getDbPool();
    const [userRows] = await pool.query('SELECT id, email, name, role, status, created_at FROM users WHERE id = ?', [userId]);
    const user = userRows[0] || null;
    if (!user) return null;

    const [workflows] = await pool.query(
      'SELECT id, name, description, status, current_version, created_at, updated_at FROM workflows WHERE created_by = ? ORDER BY updated_at DESC',
      [userId]
    );

    const [[{ totalExecutions }]] = await pool.query(
      `SELECT COUNT(e.id) AS totalExecutions 
       FROM executions e 
       JOIN workflows w ON e.workflow_id = w.id 
       WHERE w.created_by = ?`,
      [userId]
    );

    return {
      user,
      workflows,
      totalExecutions: Number(totalExecutions || 0),
    };
  }
}

export const adminRepository = new AdminRepository();
