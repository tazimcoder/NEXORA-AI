import crypto from 'crypto';
import { logger } from '../../utils/logger.js';

export class TaskPlanner {
  /**
   * Decomposes a high-level user task prompt into a structured sub-task execution plan.
   * @param {string} userTask 
   * @param {object} options 
   * @returns {object} Execution plan with sub-tasks
   */
  async planTask(userTask, options = {}) {
    logger.info(`[Task Planner] Planning and decomposing user task: "${userTask}"`);

    if (!userTask || typeof userTask !== 'string' || userTask.trim().length === 0) {
      throw new Error('Task Planner requires a valid userTask description prompt');
    }

    const taskText = userTask.toLowerCase();
    const subTasks = [];

    // Rule-based / Intent-based Task Decomposition
    if (options.forceSingleAgent) {
      subTasks.push({
        id: `task_${crypto.randomUUID().slice(0, 8)}`,
        agentId: options.forceSingleAgent,
        taskType: 'execute_task',
        input: { prompt: userTask },
        isParallel: false,
        isSensitive: Boolean(options.isSensitive),
        timeoutMs: options.timeoutMs || 15000,
      });
    } else {
      // Decompose into standard multi-agent pipeline
      // 1. Research Step
      subTasks.push({
        id: `subtask_1_research`,
        agentId: 'research_agent',
        taskType: 'research_topic',
        input: { topic: userTask, query: userTask },
        isParallel: true,
        isSensitive: false,
        timeoutMs: options.timeoutMs || 15000,
      });

      // 2. Data Analysis Step (runs in parallel with Research or after)
      subTasks.push({
        id: `subtask_2_analysis`,
        agentId: 'data_analysis_agent',
        taskType: 'analyze_data',
        input: { taskPrompt: userTask },
        isParallel: true,
        isSensitive: false,
        timeoutMs: options.timeoutMs || 15000,
      });

      // 3. Workflow Construction Step
      subTasks.push({
        id: `subtask_3_workflow`,
        agentId: 'workflow_agent',
        taskType: 'construct_workflow',
        input: { title: userTask },
        isParallel: false,
        isSensitive: false,
        timeoutMs: options.timeoutMs || 15000,
      });

      // 4. Action Step (sensitive if explicitly requested)
      if (taskText.includes('send') || taskText.includes('email') || taskText.includes('deploy') || options.includeAction) {
        subTasks.push({
          id: `subtask_4_action`,
          agentId: 'action_agent',
          taskType: 'execute_action',
          input: { action: 'execute_action', isSensitive: options.isSensitive || taskText.includes('deploy') },
          isParallel: false,
          isSensitive: Boolean(options.isSensitive || taskText.includes('deploy')),
          timeoutMs: options.timeoutMs || 15000,
        });
      }
    }

    return {
      planId: `plan_${crypto.randomUUID().slice(0, 8)}`,
      userTask,
      subTaskCount: subTasks.length,
      subTasks,
      hasParallelTasks: subTasks.some((t) => t.isParallel),
      requiresApproval: subTasks.some((t) => t.isSensitive),
      createdAt: new Date().toISOString(),
    };
  }
}

export const taskPlanner = new TaskPlanner();
