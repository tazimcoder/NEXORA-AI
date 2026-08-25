import { logger } from '../../utils/logger.js';
import { ResearchAgent } from './definitions/research.agent.js';
import { DataAnalysisAgent } from './definitions/data_analysis.agent.js';
import { WorkflowAgent } from './definitions/workflow.agent.js';
import { ActionAgent } from './definitions/action.agent.js';
import { ReviewAgent } from './definitions/review.agent.js';

class AgentRegistry {
  constructor() {
    this.agents = new Map();
    this.registerBuiltInAgents();
  }

  /**
   * Registers a specialized agent instance.
   * @param {BaseAgent} agent 
   */
  register(agent) {
    if (!agent || !agent.id) {
      throw new Error('Invalid agent instance');
    }
    this.agents.set(agent.id, agent);
    logger.info(`Registered Specialized Agent: [${agent.id}] (${agent.name} - Role: ${agent.role})`);
  }

  /**
   * Registers default initial 5 specialized agents.
   */
  registerBuiltInAgents() {
    this.register(new ResearchAgent());
    this.register(new DataAnalysisAgent());
    this.register(new WorkflowAgent());
    this.register(new ActionAgent());
    this.register(new ReviewAgent());
  }

  /**
   * Retrieves registered agent instance by ID.
   * @param {string} agentId 
   * @returns {BaseAgent}
   */
  getAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Specialized agent '${agentId}' is not registered in AgentRegistry`);
    }
    return agent;
  }

  /**
   * Retrieves agent instance by role key.
   * @param {string} role 
   * @returns {BaseAgent}
   */
  getAgentByRole(role) {
    for (const agent of this.agents.values()) {
      if (agent.role === role) return agent;
    }
    throw new Error(`No specialized agent registered for role '${role}'`);
  }

  /**
   * Verifies agent capability permission.
   * @param {string} agentId 
   * @param {string} capability 
   * @returns {boolean}
   */
  verifyPermission(agentId, capability) {
    const agent = this.getAgent(agentId);
    return agent.hasCapability(capability);
  }

  /**
   * Lists all registered agents and their metadata.
   */
  listAgents() {
    const list = [];
    for (const [id, agent] of this.agents.entries()) {
      list.push({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        description: agent.description,
        capabilities: Array.from(agent.capabilities),
        requiresApproval: agent.requiresApproval,
      });
    }
    return list;
  }
}

export const agentRegistry = new AgentRegistry();
