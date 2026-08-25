import { BaseEmailProvider } from './base-email.provider.js';
import { logger } from '../../../../utils/logger.js';
import { maskSecret } from '../../../../utils/crypto.utils.js';

export class SmtpEmailProvider extends BaseEmailProvider {
  constructor() {
    super('smtp');
  }

  async sendEmail({ to, subject, text, html, credentials = {} }) {
    const smtpHost = credentials.smtpHost || process.env.SMTP_HOST || 'smtp.nexora.ai';
    const smtpUser = credentials.smtpUser || process.env.SMTP_USER || 'notifications@nexora.ai';

    logger.info(`[SMTP Provider] Dispatching Email to [${to}] Subject: "${subject}" via host [${smtpHost}] (user: ${maskSecret(smtpUser)})`);

    // Simulated email delivery result (Production uses nodemailer or SMTP transport)
    const messageId = `<msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@nexora.ai>`;

    return {
      success: true,
      messageId,
      recipient: to,
      subject,
      provider: this.name,
      sentAt: new Date().toISOString(),
    };
  }
}
