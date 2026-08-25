import { getDbPool } from '../../config/db.config.js';
import crypto from 'crypto';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../utils/apiError.js';

export class ApprovalService {
  async createApprovalRequest({ workspaceId, userId, executionId, stepId, nodeName, reason, recoveryStrategy }) {
    const pool = getDbPool();
    const notificationId = crypto.randomUUID();
    const auditId = crypto.randomUUID();

    const title = `Human Approval Required: Node [${nodeName}]`;
    const message = `Execution [${executionId}] paused due to ${reason}. Strategy [${recoveryStrategy}] requires explicit human approval.`;

    // 1. Create Approval Request Notification
    await pool.query(
      `INSERT INTO notifications (id, workspace_id, user_id, type, title, message, is_read) 
       VALUES (?, ?, ?, 'approval_request', ?, ?, FALSE)`,
      [notificationId, workspaceId, userId || null, title, message]
    );

    // 2. Persist Audit History Log
    await pool.query(
      `INSERT INTO audit_logs (id, workspace_id, user_id, action, resource_type, resource_id, metadata_json) 
       VALUES (?, ?, ?, 'APPROVAL_REQUESTED', 'execution', ?, ?)`,
      [
        auditId,
        workspaceId,
        userId || null,
        executionId,
        JSON.stringify({ stepId, nodeName, reason, recoveryStrategy, notificationId }),
      ]
    );

    logger.info(`Human Approval Request created [Notification ID: ${notificationId}, Execution: ${executionId}]`);
    return {
      notificationId,
      executionId,
      status: 'pending_approval',
      title,
      message,
    };
  }

  async getPendingApprovals(workspaceId) {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT * FROM notifications 
       WHERE workspace_id = ? AND type = 'approval_request' AND is_read = FALSE 
       ORDER BY created_at DESC`,
      [workspaceId]
    );
    return rows;
  }

  async approveRecovery(notificationId, workspaceId, userId) {
    const pool = getDbPool();
    const auditId = crypto.randomUUID();

    const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ? AND workspace_id = ?', [notificationId, workspaceId]);
    if (rows.length === 0) {
      throw ApiError.notFound('Approval request notification not found');
    }

    // Mark notification as read / resolved
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [notificationId]);

    // Record Audit History
    await pool.query(
      `INSERT INTO audit_logs (id, workspace_id, user_id, action, resource_type, resource_id, metadata_json) 
       VALUES (?, ?, ?, 'APPROVAL_GRANTED', 'notification', ?, ?)`,
      [auditId, workspaceId, userId, notificationId, JSON.stringify({ notificationId, approvedBy: userId })]
    );

    logger.info(`Human Approval GRANTED by User [${userId}] for Notification [${notificationId}]`);
    return {
      approved: true,
      notificationId,
      status: 'approved',
    };
  }

  async rejectRecovery(notificationId, workspaceId, userId) {
    const pool = getDbPool();
    const auditId = crypto.randomUUID();

    const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ? AND workspace_id = ?', [notificationId, workspaceId]);
    if (rows.length === 0) {
      throw ApiError.notFound('Approval request notification not found');
    }

    // Mark notification as read / resolved
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [notificationId]);

    // Record Audit History
    await pool.query(
      `INSERT INTO audit_logs (id, workspace_id, user_id, action, resource_type, resource_id, metadata_json) 
       VALUES (?, ?, ?, 'APPROVAL_REJECTED', 'notification', ?, ?)`,
      [auditId, workspaceId, userId, notificationId, JSON.stringify({ notificationId, rejectedBy: userId })]
    );

    logger.info(`Human Approval REJECTED by User [${userId}] for Notification [${notificationId}]`);
    return {
      rejected: true,
      notificationId,
      status: 'rejected',
    };
  }
}

export const approvalService = new ApprovalService();
