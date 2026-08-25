import { z } from 'zod';

export const GeneratePlanPromptSchema = z.object({
  prompt: z.string().min(5, 'Prompt must be at least 5 characters long'),
});

export const ApprovePlanSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  definition: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
  }),
});

export const PlannerPlanNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['trigger', 'condition', 'action']),
  subtype: z.string().default('manual'),
  label: z.string().min(1),
  config: z.record(z.any()).optional().default({}),
});

export const PlannerPlanEdgeSchema = z.object({
  id: z.string().optional(),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().nullable().optional(),
});

export const PlannerPlanSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
  nodes: z.array(PlannerPlanNodeSchema).min(1, 'Generated plan must contain at least one node'),
  edges: z.array(PlannerPlanEdgeSchema).default([]),
});
