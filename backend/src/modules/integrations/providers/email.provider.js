import { z } from 'zod';
import { BaseIntegrationProvider } from './base.provider.js';
import { SmtpEmailProvider } from './email/smtp.provider.js';

const EmailPayloadSchema = z.object({
  to: z.string().email('Valid recipient email address is required'),
  subject: z.string().min(1, 'Email subject is required'),
  text: z.string().optional(),
  html: z.string().optional(),
});

const CredentialsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional().default(587),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
});

export class EmailIntegrationProvider extends BaseIntegrationProvider {
  constructor() {
    super(
      'email',
      'Universal Email Provider',
      'Abstract email connector for sending notification and transactional emails via SMTP or email service providers',
      '1.0.0'
    );
    this.emailEngine = new SmtpEmailProvider();
  }

  getSchema() {
    return {
      credentials: [
        { key: 'smtpHost', label: 'SMTP Host', type: 'text', required: true, placeholder: 'smtp.sendgrid.net' },
        { key: 'smtpPort', label: 'SMTP Port', type: 'number', default: 587 },
        { key: 'smtpUser', label: 'SMTP Username', type: 'text', required: true },
        { key: 'smtpPassword', label: 'SMTP Password', type: 'password', required: true },
      ],
      config: [
        { key: 'to', label: 'Recipient Email', type: 'text', required: true, placeholder: 'user@example.com' },
        { key: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'Workflow Alert' },
        { key: 'text', label: 'Body (Plain Text)', type: 'textarea', required: false },
        { key: 'html', label: 'Body (HTML)', type: 'textarea', required: false },
      ],
      actions: ['send_email'],
    };
  }

  validateCredentials(credentials) {
    const result = CredentialsSchema.safeParse(credentials || {});
    if (!result.success) {
      throw new Error(`Email credentials validation failed: ${JSON.stringify(result.error.format())}`);
    }
    return result.data;
  }

  validateConfig(config) {
    const result = EmailPayloadSchema.safeParse(config || {});
    if (!result.success) {
      throw new Error(`Email parameters validation failed: ${JSON.stringify(result.error.format())}`);
    }
    return result.data;
  }

  async execute(action, params = {}, credentials = {}) {
    if (action !== 'send_email') {
      throw new Error(`Action '${action}' is not supported by EmailIntegrationProvider`);
    }

    const validParams = this.validateConfig(params.config || params);
    const validCreds = this.validateCredentials(credentials);

    const result = await this.emailEngine.sendEmail({
      to: validParams.to,
      subject: validParams.subject,
      text: validParams.text,
      html: validParams.html,
      credentials: validCreds,
    });

    return {
      success: true,
      provider: this.name,
      action,
      output: result,
    };
  }
}

export const emailIntegrationProvider = new EmailIntegrationProvider();
