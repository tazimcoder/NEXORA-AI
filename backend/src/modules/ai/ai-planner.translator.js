export const translateProposalToDefinition = (validatedPlan) => {
  const nodes = validatedPlan.nodes || [];
  const edges = validatedPlan.edges || [];

  // Compute visual layout positions (Vertical DAG alignment: Y += 150)
  const translatedNodes = nodes.map((node, index) => {
    return {
      id: node.id,
      type: node.type,
      subtype: node.subtype || 'manual',
      label: node.label,
      config: node.config || {},
      position: {
        x: 250 + (index % 2) * 50,
        y: 100 + index * 160,
      },
    };
  });

  const translatedEdges = edges.map((edge, index) => {
    return {
      id: edge.id || `edge_ai_${index + 1}`,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || null,
      targetHandle: null,
    };
  });

  return {
    title: validatedPlan.title,
    description: validatedPlan.description,
    definition: {
      nodes: translatedNodes,
      edges: translatedEdges,
    },
  };
};
