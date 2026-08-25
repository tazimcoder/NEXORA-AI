import crypto from 'crypto';
import { agentRegistry } from './agent.registry.js';
import { taskPlanner } from './task.planner.js';
import { resultAggregator } from './result.aggregator.js';
import { agentsRepository } from './agents.repository.js';
import { OrchestrationStatus, AgentTaskStatus } from './agent.types.js';
import { logger } from '../../utils/logger.js';

export class AgentOrchestrator {
  /**
   * Executes a high-level user task prompt through the full controlled multi-agent orchestration lifecycle.
   * @param {string} userTask 
   * @param {string} workspaceId 
   * @param {string} userId 
   * @param {object} options 
   * @returns {Promise<object>} Orchestration execution details & aggregated results
   */
  async orchestrate(userTask, workspaceId, userId, options = {}) {
    const orchestrationId = crypto.randomUUID();
    logger.info(`[Agent Orchestrator] Starting multi-agent task orchestration [ID: ${orchestrationId}] in workspace [${workspaceId}]`);

    // 1. Persist Initial Orchestration Record (Status: queued)
    await agentsRepository.createOrchestration({
      id: orchestrationId,
      workspaceId,
      userId,
      taskDescription: userTask,
      status: OrchestrationStatus.QUEUED,
    });

    await agentsRepository.createAgentLog({
      orchestrationId,
      agentId: 'orchestrator',
      logLevel: 'info',
      message: `Orchestration initialized for prompt: "${userTask}"`,
    });

    try {
      // 2. Task Planning Phase (Status: planning)
      await agentsRepository.updateOrchestrationStatus(orchestrationId, OrchestrationStatus.PLANNING);
      const plan = await taskPlanner.planTask(userTask, options);

      await agentsRepository.createAgentLog({
        orchestrationId,
        agentId: 'task_planner',
        logLevel: 'info',
        message: `Task decomposed into ${plan.subTaskCount} sub-tasks`,
        metadataJson: { subTaskCount: plan.subTaskCount, planId: plan.planId },
      });

      // 3. Execution Phase (Status: executing)
      await agentsRepository.updateOrchestrationStatus(orchestrationId, OrchestrationStatus.EXECUTING);

      const executedTaskResults = [];
      const parallelTasks = plan.subTasks.filter((t) => t.isParallel);
      const sequentialTasks = plan.subTasks.filter((t) => !t.isParallel);

      // Execute Parallel Sub-Tasks Safely (Promise.allSettled)
      if (parallelTasks.length > 0) {
        logger.info(`[Agent Orchestrator] Executing ${parallelTasks.length} parallel sub-tasks...`);

        const parallelPromises = parallelTasks.map((subTask) =>
          this.executeSingleSubTask(orchestrationId, subTask, options)
        );

        const settledResults = await Promise.allSettled(parallelPromises);

        settledResults.forEach((settled, idx) => {
          if (settled.status === 'fulfilled') {
            executedTaskResults.push(settled.value);
          } else {
            // Failed agent sub-task fallback
            const subTask = parallelTasks[idx];
            executedTaskResults.push({
              id: subTask.id,
              agentId: subTask.agentId,
              status: AgentTaskStatus.FAILED,
              error: settled.reason?.message || 'Agent execution failed',
              executionTimeMs: 0,
            });
          }
        });
      }

      // Execute Sequential Sub-Tasks
      for (const subTask of sequentialTasks) {
        try {
          const result = await this.executeSingleSubTask(orchestrationId, subTask, options);
          executedTaskResults.push(result);
        } catch (error) {
          executedTaskResults.push({
            id: subTask.id,
            agentId: subTask.agentId,
            status: AgentTaskStatus.FAILED,
            error: error.message || 'Agent execution failed',
            executionTimeMs: 0,
          });
        }
      }

      // 4. Result Aggregation Phase (Status: aggregating)
      await agentsRepository.updateOrchestrationStatus(orchestrationId, OrchestrationStatus.AGGREGATING);
      const aggregatedResult = resultAggregator.aggregateResults(executedTaskResults);

      await agentsRepository.createAgentLog({
        orchestrationId,
        agentId: 'result_aggregator',
        logLevel: 'info',
        message: `Results aggregated (completed: ${aggregatedResult.summary.completedCount}, failed: ${aggregatedResult.summary.failedCount})`,
        metadataJson: aggregatedResult.summary,
      });

      // 5. Review Agent Phase (Status: reviewing)
      await agentsRepository.updateOrchestrationStatus(orchestrationId, OrchestrationStatus.REVIEWING);
      const reviewAgent = agentRegistry.getAgent('review_agent');

      const reviewTaskRecordId = await agentsRepository.createAgentTask({
        orchestrationId,
        agentId: reviewAgent.id,
        taskType: 'review_output',
        status: AgentTaskStatus.RUNNING,
        inputJson: { aggregatedResult },
      });

      const reviewResult = await reviewAgent.executeTask({
        aggregatedResult: aggregatedResult.outputs,
        completedTaskCount: aggregatedResult.summary.completedCount,
        failedTaskCount: aggregatedResult.summary.failedCount,
      });

      await agentsRepository.updateAgentTask(reviewTaskRecordId, {
        status: AgentTaskStatus.COMPLETED,
        outputJson: reviewResult,
        executionTimeMs: 15,
      });

      // 6. Final Status & Completion (Status: completed or failed)
      const finalStatus = aggregatedResult.summary.completedCount > 0 ? OrchestrationStatus.COMPLETED : OrchestrationStatus.FAILED;

      const finalOutputPayload = {
        orchestrationId,
        workspaceId,
        status: finalStatus,
        userTask,
        reviewVerdict: reviewResult.reviewVerdict,
        aggregatedOutputs: aggregatedResult.outputs,
        summary: aggregatedResult.summary,
        completedAt: new Date().toISOString(),
      };

      await agentsRepository.updateOrchestrationStatus(
        orchestrationId,
        finalStatus,
        finalOutputPayload,
        aggregatedResult.summary
      );

      await agentsRepository.createAgentLog({
        orchestrationId,
        agentId: 'orchestrator',
        logLevel: finalStatus === OrchestrationStatus.COMPLETED ? 'info' : 'warn',
        message: `Orchestration completed with status: ${finalStatus}`,
      });

      return finalOutputPayload;
    } catch (error) {
      logger.error(`[Agent Orchestrator] Orchestration failed [ID: ${orchestrationId}]: ${error.message}`);
      
      await agentsRepository.updateOrchestrationStatus(orchestrationId, OrchestrationStatus.FAILED, {
        error: error.message,
      });

      await agentsRepository.createAgentLog({
        orchestrationId,
        agentId: 'orchestrator',
        logLevel: 'error',
        message: `Orchestration failed: ${error.message}`,
      });

      throw error;
    }
  }

  /**
   * Helper to execute a single agent sub-task with DB tracking and timeout protection.
   */
  async executeSingleSubTask(orchestrationId, subTask, options = {}) {
    const startTime = Date.now();
    const agent = agentRegistry.getAgent(subTask.agentId);

    const taskRecordId = await agentsRepository.createAgentTask({
      orchestrationId,
      agentId: agent.id,
      taskType: subTask.taskType,
      status: AgentTaskStatus.RUNNING,
      inputJson: subTask.input,
    });

    await agentsRepository.createAgentLog({
      orchestrationId,
      taskId: taskRecordId,
      agentId: agent.id,
      logLevel: 'info',
      message: `Executing task '${subTask.taskType}' on agent [${agent.name}]`,
    });

    try {
      const executionResult = await agent.executeTask(
        { ...subTask.input, isSensitive: subTask.isSensitive, timeoutMs: subTask.timeoutMs },
        { isApproved: options.isApproved }
      );

      const executionTimeMs = Date.now() - startTime;
      const status = executionResult.status === 'awaiting_approval' ? AgentTaskStatus.AWAITING_APPROVAL : AgentTaskStatus.COMPLETED;

      await agentsRepository.updateAgentTask(taskRecordId, {
        status,
        outputJson: executionResult,
        executionTimeMs,
      });

      return {
        id: subTask.id,
        taskId: taskRecordId,
        agentId: agent.id,
        status,
        output: executionResult,
        executionTimeMs,
      };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const status = error.isTimeout ? AgentTaskStatus.TIMEOUT : AgentTaskStatus.FAILED;

      await agentsRepository.updateAgentTask(taskRecordId, {
        status,
        errorMessage: error.message,
        executionTimeMs,
      });

      await agentsRepository.createAgentLog({
        orchestrationId,
        taskId: taskRecordId,
        agentId: agent.id,
        logLevel: 'error',
        message: `Agent execution failed: ${error.message}`,
      });

      return {
        id: subTask.id,
        taskId: taskRecordId,
        agentId: agent.id,
        status,
        error: error.message,
        executionTimeMs,
      };
    }
  }
}

export const agentOrchestrator = new AgentOrchestrator();
