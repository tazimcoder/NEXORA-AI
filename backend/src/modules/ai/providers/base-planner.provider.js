/**
 * Abstract Base Class for AI Planner Providers.
 * Ensures AI providers remain abstract and pluggable.
 */
export class BasePlannerProvider {
  constructor(name, displayName) {
    if (new.target === BasePlannerProvider) {
      throw new TypeError('Cannot instantiate abstract BasePlannerProvider directly');
    }
    this.name = name;
    this.displayName = displayName;
  }

  /**
   * Generates a structured automation plan from a natural language prompt.
   * @param {string} prompt User natural language description
   * @returns {Promise<object>} Raw AI response plan object
   */
  async generatePlan(prompt) {
    throw new Error(`generatePlan() method not implemented for provider [${this.name}]`);
  }
}
