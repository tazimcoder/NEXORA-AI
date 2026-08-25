import { logger } from '../../utils/logger.js';

export class ResultAggregator {
  /**
   * Merges sub-task outputs and execution metadata into an aggregated result payload.
   * @param {Array<object>} executedTasks List of executed task results
   * @returns {object} Aggregated result object
   */
  aggregateResults(executedTasks = []) {
    logger.info(`[Result Aggregator] Aggregating results from ${executedTasks.length} sub-task outputs...`);

    const completed = [];
    const failed = [];
    const awaitingApproval = [];
    const partialOutputs = {};

    let totalExecutionTimeMs = 0;

    for (const task of executedTasks) {
      totalExecutionTimeMs += task.executionTimeMs || 0;

      if (task.status === 'completed') {
        completed.push(task);
        partialOutputs[task.agentId || task.id] = task.output;
      } else if (task.status === 'awaiting_approval') {
        awaitingApproval.push(task);
        partialOutputs[task.agentId || task.id] = { status: 'awaiting_approval', requiresApproval: true };
      } else {
        failed.push(task);
        partialOutputs[task.agentId || task.id] = { error: task.error || 'Sub-task execution failed' };
      }
    }

    const isPartial = failed.length > 0 && completed.length > 0;
    const isSuccess = failed.length === 0;

    return {
      success: isSuccess,
      isPartial,
      summary: {
        totalTasks: executedTasks.length,
        completedCount: completed.length,
        failedCount: failed.length,
        awaitingApprovalCount: awaitingApproval.length,
        totalExecutionTimeMs,
      },
      outputs: partialOutputs,
      completedTasks: completed,
      failedTasks: failed,
      awaitingApprovalTasks: awaitingApproval,
      aggregatedAt: new Date().toISOString(),
    };
  }
}

export const resultAggregator = new ResultAggregator();
