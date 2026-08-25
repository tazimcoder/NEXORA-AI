import { getDbPool } from '../../config/db.config.js';
import crypto from 'crypto';

export class ExecutionsRepository {
  async createExecution({ workflowId, workspaceId, triggerType, status = 'pending' }) {
    const pool = getDbPool();
    const id = crypto.randomUUID();
    const now = new Date();

    await pool.query(
      `INSERT INTO executions 
       (id, workflow_id, workspace_id, trigger_type, status, started_at, metrics_json) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, workflowId, workspaceId, triggerType, status, now, JSON.stringify({ stepsExecuted: 0 })]
    );

    return this.findExecutionById(id);
  }

  async updateExecutionStatus(id, { status, errorMessage = null, metrics = {} }) {
    const pool = getDbPool();
    const now = new Date();
    const finishedClause = ['completed', 'failed'].includes(status) ? ', finished_at = ?' : '';
    const queryParams = [status, errorMessage, JSON.stringify(metrics)];

    if (finishedClause) {
      queryParams.push(now);
    }
    queryParams.push(id);

    await pool.query(
      `UPDATE executions 
       SET status = ?, error_message = ?, metrics_json = ? ${finishedClause} 
       WHERE id = ?`,
      queryParams
    );

    return this.findExecutionById(id);
  }

  async addExecutionLog({ executionId, stepId, nodeName, status, input = null, output = null, error = null, logLevel = 'info' }) {
    const pool = getDbPool();
    const id = crypto.randomUUID();

    await pool.query(
      `INSERT INTO execution_logs 
       (id, execution_id, step_id, node_name, status, input_json, output_json, error_json, log_level) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        executionId,
        stepId,
        nodeName,
        status,
        input ? JSON.stringify(input) : null,
        output ? JSON.stringify(output) : null,
        error ? JSON.stringify(error) : null,
        logLevel,
      ]
    );

    return id;
  }

  async findExecutionById(id) {
    const pool = getDbPool();
    const [rows] = await pool.query('SELECT * FROM executions WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findExecutionsByWorkspace(workspaceId) {
    const pool = getDbPool();
    const [rows] = await pool.query(
      'SELECT e.*, w.name as workflow_name FROM executions e JOIN workflows w ON e.workflow_id = w.id WHERE e.workspace_id = ? ORDER BY e.created_at DESC LIMIT 50',
      [workspaceId]
    );
    return rows;
  }

  async findExecutionLogs(executionId) {
    const pool = getDbPool();
    const [rows] = await pool.query(
      'SELECT * FROM execution_logs WHERE execution_id = ? ORDER BY timestamp ASC',
      [executionId]
    );
    return rows;
  }
}

export const executionsRepository = new ExecutionsRepository();
