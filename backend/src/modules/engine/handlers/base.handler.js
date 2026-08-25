/**
 * Abstract Base Class for all NEXORA AI Workflow Node Handlers.
 * Every trigger, condition, and action handler MUST extend this class.
 */
export class BaseNodeHandler {
  constructor(name, type, subtype, displayName) {
    if (new.target === BaseNodeHandler) {
      throw new TypeError('Cannot instantiate abstract BaseNodeHandler directly');
    }
    this.name = name;
    this.type = type;       // 'trigger' | 'condition' | 'action'
    this.subtype = subtype; // e.g. 'manual', 'webhook', 'http_request', 'if_else', 'create_notification', 'delay'
    this.displayName = displayName;
  }

  /**
   * Executes node logic for a specific step in the workflow graph.
   * @param {object} node Node AST definition object
   * @param {object} context Dynamic execution context (inputs, step outputs, variables)
   * @returns {Promise<{success: boolean, output: object, branch?: string}>} Node execution result
   */
  async execute(node, context) {
    throw new Error(`execute() method not implemented for node handler [${this.name}]`);
  }

  /**
   * Resolves template expressions (e.g. {{ input.path }}) or returns static value.
   * @param {any} val
   * @param {object} context
   * @returns {any}
   */
  resolveValue(val, context = {}) {
    if (val === undefined || val === null) return val;
    if (typeof val !== 'string') return val;

    if (val.includes('{{')) {
      return val.replace(/\{\{\s*([a-zA-Z0-9_\-\.]+)\s*\}\}/g, (match, path) => {
        const parts = path.split('.');
        let curr = context;
        for (const part of parts) {
          if (curr && typeof curr === 'object' && part in curr) {
            curr = curr[part];
          } else {
            return match;
          }
        }
        return curr !== undefined ? curr : match;
      });
    }

    return val;
  }
}

