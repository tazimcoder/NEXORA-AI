/**
 * Types & Constants for Phase 10 Multi-Agent Orchestration
 */

export const OrchestrationStatus = {
  QUEUED: 'queued',
  PLANNING: 'planning',
  EXECUTING: 'executing',
  AGGREGATING: 'aggregating',
  REVIEWING: 'reviewing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const AgentTaskStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  AWAITING_APPROVAL: 'awaiting_approval',
  TIMEOUT: 'timeout',
};

export const AgentRole = {
  RESEARCH: 'research_agent',
  DATA_ANALYSIS: 'data_analysis_agent',
  WORKFLOW: 'workflow_agent',
  ACTION: 'action_agent',
  REVIEW: 'review_agent',
};
