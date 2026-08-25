import { BasePlannerProvider } from './base-planner.provider.js';
import { OpenRouterIntegrationProvider } from '../../integrations/providers/openrouter.provider.js';
import { logger } from '../../../utils/logger.js';

const openRouterIntegrationProvider = new OpenRouterIntegrationProvider();

export class OpenRouterPlannerProvider extends BasePlannerProvider {
  constructor() {
    super('openrouter', 'OpenRouter LLM AI Planner');
  }

  getSystemPrompt() {
    return `You are the Lead Software Architect for NEXORA AI Automation Engine.
Your task is to convert natural language automation requests into a valid, structured NEXORA Workflow Plan JSON object.

RULES:
1. Output ONLY valid JSON matching this exact structure:
{
  "title": "Short descriptive title",
  "description": "Clear multi-step workflow summary",
  "nodes": [
    {
      "id": "node_1",
      "type": "trigger" | "condition" | "action",
      "subtype": "webhook" | "manual" | "schedule" | "if_else" | "http_request" | "create_notification" | "delay" | "internal_system",
      "label": "Human readable node title",
      "config": {}
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "sourceHandle": null | "true" | "false"
    }
  ]
}

2. Every workflow MUST start with at least one "trigger" node (e.g. schedule cron, webhook, or manual).
3. If the user mentions "Every Monday" or recurring times, use "type": "trigger", "subtype": "schedule", "config": { "cron": "0 9 * * 1" }.
4. If checking conditions, use "type": "condition", "subtype": "if_else", "config": { "operator": "equals" | "greater than" | "contains", "leftValue": "...", "rightValue": "..." }.
5. For sending emails or API calls, use "type": "action", "subtype": "http_request" or "create_notification".
6. Do NOT execute any actions. Return ONLY the JSON plan proposal.`;
  }

  async generatePlan(prompt) {
    logger.info(`AI Planner generating proposal for prompt: "${prompt}"`);

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      logger.info('No OpenRouter API key configured. Using deterministic heuristic AI Planner engine...');
      return this.generateFallbackPlan(prompt);
    }

    try {
      const result = await openRouterIntegrationProvider.execute(
        'chat_completion',
        {
          config: { model: 'openai/gpt-4o-mini' },
          messages: [
            { role: 'system', content: this.getSystemPrompt() },
            { role: 'user', content: prompt },
          ],
        },
        { apiKey }
      );

      const responseText = result.output?.text || '';
      const cleanJsonStr = responseText.replace(/```json\s*|\s*```/g, '').trim();

      return JSON.parse(cleanJsonStr);
    } catch (error) {
      logger.warn(`OpenRouter AI call failed (${error.message}). Falling back to heuristic planner...`);
      return this.generateFallbackPlan(prompt);
    }
  }

  generateFallbackPlan(prompt) {
    const lower = prompt.toLowerCase();
    const isSchedule = lower.includes('monday') || lower.includes('every') || lower.includes('daily') || lower.includes('weekly');
    const isCondition = lower.includes('check') || lower.includes('if') || lower.includes('pending') || lower.includes('status');

    const nodes = [];
    const edges = [];

    // Trigger Node
    const triggerId = 'node_trig_1';
    nodes.push({
      id: triggerId,
      type: 'trigger',
      subtype: isSchedule ? 'schedule' : 'manual',
      label: isSchedule ? 'Schedule Cron Trigger (Every Monday)' : 'Manual Automation Trigger',
      config: isSchedule ? { cron: '0 9 * * 1', timezone: 'UTC' } : {},
    });

    let lastNodeId = triggerId;

    // Condition Node
    if (isCondition) {
      const condId = 'node_cond_1';
      nodes.push({
        id: condId,
        type: 'condition',
        subtype: 'if_else',
        label: 'Check Pending Status',
        config: { operator: 'equals', leftValue: 'input.body.status', rightValue: 'pending' },
      });

      edges.push({
        id: `e_${lastNodeId}_${condId}`,
        source: lastNodeId,
        target: condId,
      });

      lastNodeId = condId;
    }

    // Action Node
    const actionId = 'node_act_1';
    nodes.push({
      id: actionId,
      type: 'action',
      subtype: 'create_notification',
      label: 'Send Email / Notification Alert',
      config: { title: 'Reminder Email Sent', message: 'Automated pending status reminder dispatched', type: 'system' },
    });

    edges.push({
      id: `e_${lastNodeId}_${actionId}`,
      source: lastNodeId,
      target: actionId,
      sourceHandle: isCondition ? 'true' : null,
    });

    return {
      title: 'Automated Pending Customer Email Reminder',
      description: `Generated from prompt: "${prompt}"`,
      nodes,
      edges,
    };
  }
}
