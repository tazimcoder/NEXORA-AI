import { BaseNodeHandler } from './base.handler.js';

export class ConditionEvaluatorHandler extends BaseNodeHandler {
  constructor() {
    super('condition_evaluator', 'condition', 'if_else', 'Condition Evaluator');
  }

  evaluateOperator(operator, leftValue, rightValue) {
    const lVal = leftValue !== undefined && leftValue !== null ? leftValue : '';
    const rVal = rightValue !== undefined && rightValue !== null ? rightValue : '';

    switch (operator) {
      case 'equals':
        return String(lVal).trim() === String(rVal).trim();

      case 'not equals':
      case 'not_equals':
        return String(lVal).trim() !== String(rVal).trim();

      case 'greater than':
      case 'greater_than':
      case '>':
        return Number(lVal) > Number(rVal);

      case 'less than':
      case 'less_than':
      case '<':
        return Number(lVal) < Number(rVal);

      case 'greater than or equal':
      case 'greater_than_or_equal':
      case '>=':
        return Number(lVal) >= Number(rVal);

      case 'less than or equal':
      case 'less_than_or_equal':
      case '<=':
        return Number(lVal) <= Number(rVal);

      case 'contains':
        if (Array.isArray(lVal)) {
          return lVal.includes(rVal);
        }
        return String(lVal).toLowerCase().includes(String(rVal).toLowerCase());

      case 'exists':
        return leftValue !== undefined && leftValue !== null && leftValue !== '';

      default:
        throw new Error(`Unsupported condition operator '${operator}'`);
    }
  }

  async execute(node, context) {
    const config = node.config || {};
    const operator = config.operator || 'equals';
    const leftOperandPath = config.leftOperand || config.leftValue || '';
    const rightOperandPath = config.rightOperand || config.rightValue || '';

    // Helper to resolve nested values from context (e.g. "input.body.status")
    const resolvePath = (path, ctx) => {
      if (!path || typeof path !== 'string') return path;
      if (!path.includes('.')) {
        return ctx[path] !== undefined ? ctx[path] : path;
      }
      return path.split('.').reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : null), ctx);
    };

    const leftVal = resolvePath(leftOperandPath, context);
    const rightVal = resolvePath(rightOperandPath, context);

    const isMatch = this.evaluateOperator(operator, leftVal, rightVal);
    const branch = isMatch ? 'true' : 'false';

    return {
      success: true,
      output: {
        operator,
        leftValue: leftVal,
        rightValue: rightVal,
        evaluated: isMatch,
        branch,
      },
      branch,
    };
  }
}
