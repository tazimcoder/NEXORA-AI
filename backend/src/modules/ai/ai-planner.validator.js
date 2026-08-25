import { PlannerPlanSchema } from './ai-planner.schema.js';
import { validateWorkflowGraph } from '../workflows/workflows.validator.js';

export const validateAIProposal = (rawPlan) => {
  const errors = [];

  // 1. Zod Schema Structure Validation
  const parsed = PlannerPlanSchema.safeParse(rawPlan);
  if (!parsed.success) {
    const details = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return { isValid: false, errors: details, plan: null };
  }

  const plan = parsed.data;

  // 2. NEXORA Graph AST Validation
  const graphValidation = validateWorkflowGraph({
    nodes: plan.nodes,
    edges: plan.edges,
  });

  if (!graphValidation.isValid) {
    return {
      isValid: false,
      errors: graphValidation.errors,
      plan,
    };
  }

  return {
    isValid: true,
    errors: [],
    plan,
  };
};
