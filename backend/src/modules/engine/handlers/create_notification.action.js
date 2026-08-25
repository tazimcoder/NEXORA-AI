import { BaseNodeHandler } from './base.handler.js';
import { getDbPool } from '../../../config/db.config.js';
import crypto from 'crypto';

export class CreateNotificationActionHandler extends BaseNodeHandler {
  constructor() {
    super('create_notification_action', 'action', 'create_notification', 'Create Notification Action');
  }

  async execute(node, context) {
    const config = node.config || {};
    const workspaceId = context.workspaceId;
    let userId = context.userId || config.userId;
    const title = config.title || 'Workflow Execution Alert';
    const message = config.message || 'Action step executed successfully';
    const type = config.type || 'system';
    const pool = getDbPool();

    if (!userId && workspaceId) {
      const [rows] = await pool.query('SELECT owner_id FROM workspaces WHERE id = ?', [workspaceId]);
      if (rows[0]) {
        userId = rows[0].owner_id;
      }
    }

    if (!workspaceId || !userId) {
      throw new Error('Create Notification Action requires workspaceId and userId in context');
    }


    const id = crypto.randomUUID();

    await pool.query(
      `INSERT INTO notifications (id, workspace_id, user_id, type, title, message, is_read) 
       VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
      [id, workspaceId, userId, type, title, message]
    );


    return {
      success: true,
      output: {
        notificationId: id,
        workspaceId,
        userId,
        title,
        message,
        createdAt: new Date().toISOString(),
      },
    };
  }
}
