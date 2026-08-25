export class BaseEmailProvider {
  constructor(name) {
    if (new.target === BaseEmailProvider) {
      throw new TypeError('Cannot instantiate abstract BaseEmailProvider directly');
    }
    this.name = name;
  }

  /**
   * Sends an email dispatch.
   * @param {{ to: string, subject: string, text?: string, html?: string, credentials?: object }} payload Email options
   * @returns {Promise<object>} Dispatch result
   */
  async sendEmail(payload) {
    throw new Error(`sendEmail() method not implemented for email provider [${this.name}]`);
  }
}
