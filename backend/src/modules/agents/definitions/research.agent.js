import { BaseAgent } from './base.agent.js';
import { AgentRole } from '../agent.types.js';
import { logger } from '../../../utils/logger.js';

export class ResearchAgent extends BaseAgent {
  constructor() {
    super(
      'research_agent',
      'Research Agent',
      AgentRole.RESEARCH,
      'Gathers information, queries external endpoints, and extracts topic context',
      ['search_web', 'fetch_data', 'read_documentation', 'research_topic'],
      false
    );
  }

  async executeTask(taskInput = {}, context = {}) {
    logger.info(`[Research Agent] Executing research task: "${taskInput.topic || taskInput.query || 'General Research'}"`);

    const action = taskInput.action || 'research_topic';
    if (!this.hasCapability(action)) {
      throw new Error(`Research Agent lacks permission for capability '${action}'`);
    }

    const taskExecution = async () => {
      const topic = taskInput.topic || taskInput.query || 'Automation Best Practices';
      
      // Simulated structured research findings
      return {
        agentId: this.id,
        agentName: this.name,
        topic,
        findings: [
          `Gathered latest insights on topic: ${topic}`,
          `Identified 3 optimal API endpoints and data schemas`,
          `Verified security & authentication requirements`,
        ],
        dataSources: ['NEXORA Knowledge Base', 'REST Documentation Schema'],
        timestamp: new Date().toISOString(),
      };
    };

    return await this.withTimeout(taskExecution(), taskInput.timeoutMs || 15000);
  }
}
