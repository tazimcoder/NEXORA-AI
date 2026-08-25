import { z } from 'zod';

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  definition: z.object({
    nodes: z.array(z.any()).default([]),
    edges: z.array(z.any()).default([]),
  }).optional(),
});

export const UpdateWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required').optional(),
  description: z.string().optional(),
  definition: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
  }).optional(),
});
