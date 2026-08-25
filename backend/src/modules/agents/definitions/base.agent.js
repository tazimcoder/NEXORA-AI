import { logger } from '../../../utils/logger.js';

export class BaseAgent {
  constructor(id, name, role, description, capabilities = [], requiresApproval = false) {
    if (new.target === BaseAgent) {
      throw new TypeError('Cannot instantiate abstract BaseAgent class directly');
    }
    this.id = id;
    this.name = name;
    this.role = role;
    this.description = description;
    this.capabilities = new Set(capabilities);
    this.requiresApproval = requiresApproval;
  }

  /**
   * Verifies if agent possesses permission for a specific capability/action.
   * @param {string} capability 
   * @returns {boolean}
   */
  hasCapability(capability) {
    return this.capabilities.has(capability) || this.capabilities.has('*');
  }

  /**
   * Executes a assigned task within agent's capability scope.
   * Subclasses MUST override this method.
   * @param {object} taskInput 
   * @param {object} context 
   * @returns {Promise<object>} Execution output result
   */
  async executeTask(taskInput, context = {}) {
    throw new Error(`executeTask() not implemented for agent ${this.name}`);
  }

  /**
   * Timeout execution wrapper to prevent long-running tasks from hanging orchestration.
   */
  async withTimeout(promise, timeoutMs = 30000) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        const err = new Error(`Agent [${this.name}] task execution timed out after ${timeoutMs}ms`);
        err.isTimeout = true;
        err.statusCode = 408;
        reject(err);
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}
