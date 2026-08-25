import { workflowsRepository } from '../workflows/workflows.repository.js';
import { executionsRepository } from '../executions/executions.repository.js';
import { nodeHandlerRegistry } from './node-handler.registry.js';
import { validateWorkflowGraph } from '../workflows/workflows.validator.js';
import { broadcastExecutionLog, broadcastNodeStatus } from '../../socket/socket.server.js';
import { errorAnalyzer } from '../self-healing/error.analyzer.js';
import { recoveryStrategyRegistry } from '../self-healing/recovery-strategy.registry.js';
import { approvalService } from '../self-healing/approval.service.js';
import { logger } from '../../utils/logger.js';

export class WorkflowExecutor {
  /**
   * Executes a workflow blueprint graph.
   * @param {string} workflowId Workflow database ID
   * @param {string} workspaceId Owning workspace ID
   * @param {string} triggerType Trigger method ('manual' | 'webhook' | 'schedule')
   * @param {object} inputPayload Incoming trigger payload
   * @param {string} userId Optional executing user ID
   */
  async executeWorkflow({ workflowId, workspaceId, triggerType = 'manual', inputPayload = {}, userId = null, executionId: targetExecutionId = null }) {
    const startTime = Date.now();
    logger.info(`Starting Workflow Execution [Workflow ID: ${workflowId}, Trigger: ${triggerType}]`);

    // 1. Load Workflow Definition AST
    const workflow = await workflowsRepository.findById(workflowId, workspaceId);
    if (!workflow) {
      throw new Error(`Workflow blueprint '${workflowId}' not found in workspace '${workspaceId}'`);
    }

    // 2. Validate Graph AST
    const validation = validateWorkflowGraph(workflow.definition_json);
    if (!validation.isValid) {
      throw new Error(`Cannot execute invalid workflow graph: ${validation.errors.join('; ')}`);
    }

    // 3. Initialize or Update Execution Record in DB
    let execution;
    if (targetExecutionId) {
      execution = await executionsRepository.updateExecutionStatus(targetExecutionId, { status: 'running' });
    } else {
      execution = await executionsRepository.createExecution({
        workflowId,
        workspaceId,
        triggerType,
        status: 'running',
      });
    }

    const executionId = execution ? execution.id : targetExecutionId;
    let stepCount = 0;

    // Execution Context Store
    const context = {
      executionId,
      workflowId,
      workspaceId,
      userId,
      input: inputPayload,
      steps: {},
    };



    const nodes = workflow.definition_json.nodes || [];
    const edges = workflow.definition_json.edges || [];

    // Map Node ID -> Node Definition
    const nodeMap = new Map();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // Map Node ID -> Outgoing Edges
    const outgoingEdgesMap = new Map();
    edges.forEach((e) => {
      if (!outgoingEdgesMap.has(e.source)) {
        outgoingEdgesMap.set(e.source, []);
      }
      outgoingEdgesMap.get(e.source).push(e);
    });

    // Find Initial Trigger Nodes
    const triggerNodes = nodes.filter((n) => n.type === 'trigger');
    const queue = [...triggerNodes];
    const executedNodes = new Set();

    try {
      while (queue.length > 0) {
        const currentNode = queue.shift();
        if (executedNodes.has(currentNode.id)) continue;
        executedNodes.add(currentNode.id);
        stepCount++;

        const stepStartTime = Date.now();
        const handler = nodeHandlerRegistry.getHandler(currentNode.type, currentNode.subtype || 'default');

        // Broadcast Node Starting State
        broadcastNodeStatus(executionId, {
          stepId: currentNode.id,
          nodeName: currentNode.label || currentNode.id,
          status: 'running',
        });

        logger.info(`Executing Node [${currentNode.id}] (${currentNode.label}) using handler [${handler.name}]`);

        let stepResult;
        let stepError = null;

        try {
          stepResult = await handler.execute(currentNode, context);
          context.steps[currentNode.id] = {
            output: stepResult.output,
            success: true,
          };

          // Save Step Success Log to DB
          await executionsRepository.addExecutionLog({
            executionId,
            stepId: currentNode.id,
            nodeName: currentNode.label || currentNode.id,
            status: 'success',
            input: context.input,
            output: stepResult.output,
            logLevel: 'info',
          });

          // Stream Live Telemetry via Socket.IO
          broadcastExecutionLog(executionId, {
            executionId,
            stepId: currentNode.id,
            nodeName: currentNode.label || currentNode.id,
            status: 'success',
            output: stepResult.output,
            durationMs: Date.now() - stepStartTime,
            timestamp: new Date().toISOString(),
          });

          broadcastNodeStatus(executionId, {
            stepId: currentNode.id,
            nodeName: currentNode.label || currentNode.id,
            status: 'success',
          });

        } catch (err) {
          stepError = err;
          logger.error(`Node Execution Error [${currentNode.id}]: ${err.message}`, { stack: err.stack });

          // Phase 8 Self-Healing Error Analysis & Recovery Strategy Lookup
          const diagnosis = errorAnalyzer.classify(err);
          const recoveryStrategy = recoveryStrategyRegistry.getStrategy(diagnosis.category);

          logger.warn(
            `[Self-Healing Diagnostic] Node [${currentNode.id}] Failure Classified: Category=[${diagnosis.category}], Strategy=[${recoveryStrategy.name}], Destructive=[${diagnosis.isDestructive}]`
          );

          // Save Step Failure Log to DB
          await executionsRepository.addExecutionLog({
            executionId,
            stepId: currentNode.id,
            nodeName: currentNode.label || currentNode.id,
            status: 'failed',
            input: context.input,
            error: { message: err.message, stack: err.stack, diagnosis, recoveryStrategy: recoveryStrategy.name },
            logLevel: 'error',
          });

          // Save Diagnostic Self-Healing Log to DB
          await executionsRepository.addExecutionLog({
            executionId,
            stepId: 'self_healing_recovery',
            nodeName: `Self-Healing: ${currentNode.label || currentNode.id}`,
            status: 'recovery_diagnosed',
            input: { category: diagnosis.category, reason: diagnosis.reason },
            output: { strategy: recoveryStrategy.name, action: recoveryStrategy.action },
            logLevel: 'warn',
          });

          // Handle Human Approval Escalation for Auth/Business Rule Errors or Destructive Actions
          if (recoveryStrategy.action === 'escalate_human_approval' || diagnosis.isDestructive) {
            await approvalService.createApprovalRequest({
              workspaceId,
              userId,
              executionId,
              stepId: currentNode.id,
              nodeName: currentNode.label || currentNode.id,
              reason: diagnosis.reason,
              recoveryStrategy: recoveryStrategy.name,
            });
          }

          broadcastExecutionLog(executionId, {
            executionId,
            stepId: currentNode.id,
            nodeName: currentNode.label || currentNode.id,
            status: 'failed',
            error: err.message,
            diagnosis,
            recoveryStrategy: recoveryStrategy.name,
            durationMs: Date.now() - stepStartTime,
            timestamp: new Date().toISOString(),
          });

          broadcastNodeStatus(executionId, {
            stepId: currentNode.id,
            nodeName: currentNode.label || currentNode.id,
            status: 'failed',
          });

          throw err; // Stop execution on node failure
        }

        // Determine Next Downstream Neighbor Nodes based on Edges & Branching
        const outgoingEdges = outgoingEdgesMap.get(currentNode.id) || [];
        for (const edge of outgoingEdges) {
          const targetNode = nodeMap.get(edge.target);
          if (!targetNode) continue;

          // If node was a Condition Evaluator, follow edge matching the active branch handle ('true'/'false')
          if (currentNode.type === 'condition' && stepResult?.branch) {
            const edgeHandle = edge.sourceHandle || 'true';
            if (edgeHandle !== stepResult.branch) {
              logger.info(`Skipping branch [${edgeHandle}] from condition [${currentNode.id}] (active branch: [${stepResult.branch}])`);
              continue;
            }
          }

          queue.push(targetNode);
        }
      }

      const totalDuration = Date.now() - startTime;

      // Update Execution Status to Completed
      const completedExecution = await executionsRepository.updateExecutionStatus(executionId, {
        status: 'completed',
        metrics: {
          stepsExecuted: stepCount,
          durationMs: totalDuration,
        },
      });

      logger.info(`Workflow Execution Completed Successfully [Execution ID: ${executionId}] in ${totalDuration}ms`);
      return {
        success: true,
        execution: completedExecution,
        context,
      };

    } catch (fatalError) {
      const totalDuration = Date.now() - startTime;

      // Update Execution Status to Failed
      const failedExecution = await executionsRepository.updateExecutionStatus(executionId, {
        status: 'failed',
        errorMessage: fatalError.message,
        metrics: {
          stepsExecuted: stepCount,
          durationMs: totalDuration,
        },
      });

      logger.error(`Workflow Execution Failed [Execution ID: ${executionId}]: ${fatalError.message}`);
      return {
        success: false,
        execution: failedExecution,
        error: fatalError.message,
      };
    }
  }
}

export const workflowExecutor = new WorkflowExecutor();
