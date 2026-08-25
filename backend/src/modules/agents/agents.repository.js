import { getDbPool } from '../../config/db.config.js';
import crypto from 'crypto';

export class AgentsRepository {
  async createOrchestration({ id, workspaceId, userId, taskDescription, status = 'queued' }) {
    const pool = getDbPool();
    const orchId = id || crypto.randomUUID();
    await pool.query(
      `INSERT INTO agent_orchestrations (id, workspace_id, user_id, task_description, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [orchId, workspaceId, userId, taskDescription, status]
    );
    return orchId;
  }

  async updateOrchestrationStatus(id, status, resultJson = null, metricsJson = null) {
    const pool = getDbPool();
    await pool.query(
      `UPDATE agent_orchestrations 
       SET status = ?, result_json = ?, metrics_json = ? 
       WHERE id = ?`,
      [status, resultJson ? JSON.stringify(resultJson) : null, metricsJson ? JSON.stringify(metricsJson) : null, id]
    );
  }

  async createAgentTask({ id, orchestrationId, agentId, taskType, status = 'pending', inputJson = null }) {
    const pool = getDbPool();
    const taskId = id || crypto.randomUUID();
    await pool.query(
      `INSERT INTO agent_tasks (id, orchestration_id, agent_id, task_type, status, input_json) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [taskId, orchestrationId, agentId, taskType, status, inputJson ? JSON.stringify(inputJson) : null]
    );
    return taskId;
  }

  async updateAgentTask(id, { status, outputJson = null, errorMessage = null, executionTimeMs = null }) {
    const pool = getDbPool();
    await pool.query(
      `UPDATE agent_tasks 
       SET status = ?, output_json = ?, error_message = ?, execution_time_ms = ?, finished_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        status,
        outputJson ? JSON.stringify(outputJson) : null,
        errorMessage || null,
        executionTimeMs || null,
        id,
      ]
    );
  }

  async createAgentLog({ orchestrationId, taskId = null, agentId, logLevel = 'info', message, metadataJson = null }) {
    const pool = getDbPool();
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO agent_logs (id, orchestration_id, task_id, agent_id, log_level, message, metadata_json) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, orchestrationId, taskId, agentId, logLevel, message, metadataJson ? JSON.stringify(metadataJson) : null]
    );
    return id;
  }

  async getOrchestrationById(id) {
    const pool = getDbPool();
    const [orchRows] = await pool.query('SELECT * FROM agent_orchestrations WHERE id = ?', [id]);
    if (!orchRows[0]) return null;

    const [taskRows] = await pool.query('SELECT * FROM agent_tasks WHERE orchestration_id = ? ORDER BY created_at ASC', [id]);
    const [logRows] = await pool.query('SELECT * FROM agent_logs WHERE orchestration_id = ? ORDER BY created_at ASC', [id]);

    return {
      ...orchRows[0],
      tasks: taskRows,
      logs: logRows,
    };
  }

  async getWorkspaceOrchestrations(workspaceId) {
    const pool = getDbPool();
    const [rows] = await pool.query('SELECT * FROM agent_orchestrations WHERE workspace_id = ? ORDER BY created_at DESC', [workspaceId]);
    return rows;
  }
}

export const agentsRepository = new AgentsRepository();
