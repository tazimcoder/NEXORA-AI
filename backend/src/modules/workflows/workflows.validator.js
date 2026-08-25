/**
 * Validates a workflow Graph AST (Nodes & Edges structure).
 * Returns { isValid: boolean, errors: string[] }
 */
export const validateWorkflowGraph = (definitionJson) => {
  const errors = [];

  if (!definitionJson || typeof definitionJson !== 'object') {
    return { isValid: false, errors: ['Workflow definition must be a valid JSON object'] };
  }

  const nodes = definitionJson.nodes;
  const edges = definitionJson.edges || [];

  if (!Array.isArray(nodes) || nodes.length === 0) {
    errors.push('Workflow graph must contain at least one node');
    return { isValid: false, errors };
  }

  if (!Array.isArray(edges)) {
    errors.push('Workflow edges must be an array');
  }

  const nodeMap = new Map();
  let hasTrigger = false;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node.id || typeof node.id !== 'string') {
      errors.push(`Node at index ${i} is missing a valid 'id'`);
      continue;
    }

    if (nodeMap.has(node.id)) {
      errors.push(`Duplicate node ID '${node.id}' found in workflow graph`);
    }

    nodeMap.set(node.id, node);

    if (!node.type || typeof node.type !== 'string') {
      errors.push(`Node '${node.id}' is missing a valid 'type'`);
    }

    if (node.type === 'trigger') {
      hasTrigger = true;
    }
  }

  if (!hasTrigger) {
    errors.push('Workflow must contain at least one Trigger node to be published');
  }

  if (Array.isArray(edges)) {
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      if (!edge.source || !nodeMap.has(edge.source)) {
        errors.push(`Edge at index ${i} references unknown source node '${edge.source}'`);
      }
      if (!edge.target || !nodeMap.has(edge.target)) {
        errors.push(`Edge at index ${i} references unknown target node '${edge.target}'`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
