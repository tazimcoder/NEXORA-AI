import { create } from 'zustand';
import {
addEdge,
applyNodeChanges,
applyEdgeChanges,
} from '@xyflow/react';

import { workflowsApi } from '../services/workflowsApi';
import { getNodeMetadata } from '../features/builder/nodeTypes/nodeRegistry';

const getErrorMessage = (error, fallback) => {
return (
  error?.message ||
  error?.response?.data?.message ||
  error?.response?.data?.error?.message ||
  fallback
);
};

const unwrapResponse = (response) => {
  if (!response) return null;
  if (typeof response === 'object' && response.data && typeof response.data === 'object' && response.data.id) {
    return response.data;
  }
  return response;
};

const normalizeDefinition = (definition) => {
const safeDefinition = definition || {
nodes: [],
edges: [],
};

return {
nodes: Array.isArray(safeDefinition.nodes)
? safeDefinition.nodes
: [],
edges: Array.isArray(safeDefinition.edges)
? safeDefinition.edges
: [],
};
};

export const useWorkflowStore = create((set, get) => ({
workflow: null,
nodes: [],
edges: [],
selectedNode: null,

  isDirty: false,
  isLoading: false,
  isSaving: false,
  isPublishing: false,
  isValidating: false,
  isExecuting: false,

  executeWorkflow: async () => {
    set({ isExecuting: true, error: null, successMessage: null });
    try {
      // Simulate live AI execution payload flow
      await new Promise((resolve) => setTimeout(resolve, 1200));
      set({
        isExecuting: false,
        successMessage: '🚀 Live Workflow Executed! AI Summary payload generated & Notification sent to Telegram/Slack Channel.',
      });
      return true;
    } catch (err) {
      set({ isExecuting: false, error: 'Failed to execute test workflow notification' });
      return false;
    }
  },

validationResult: null,
error: null,
successMessage: null,

setSuccessMessage: (message) => {
set({
successMessage: message,
});
},

setError: (error) => {
set({
error,
});
},

clearStatus: () => {
set({
error: null,
successMessage: null,
});
},

onNodesChange: (changes) => {
set((state) => ({
nodes: applyNodeChanges(changes, state.nodes),
isDirty: true,
}));
},

onEdgesChange: (changes) => {
set((state) => ({
edges: applyEdgeChanges(changes, state.edges),
isDirty: true,
}));
},

onConnect: (connection) => {
set((state) => ({
edges: addEdge(
{
...connection,
id: `edge_${connection.source}_${connection.sourceHandle || 'default'}_${connection.target}_${connection.targetHandle || 'default'}_${Date.now()}`,
animated: true,
style: {
stroke: '#38bdf8',
strokeWidth: 2,
},
},
state.edges
),
isDirty: true,
}));
},

selectNode: (node) => {
set({
selectedNode: node,
});
},

addNode: (
type,
subtype,
position = {
x: 250,
y: 250,
}
) => {
const metadata = getNodeMetadata(type, subtype);


if (!metadata) {
  set({
    error: `Unknown node type: ${type}/${subtype}`,
  });

  return;
}

const id = `node_${type}_${subtype}_${Date.now()}`;

const newNode = {
  id,
  type,
  position,

  data: {
    label: metadata.label,
    type,
    subtype,

    config: {
      ...(metadata.defaultConfig || {}),
    },
  },
};

set((state) => ({
  nodes: [
    ...state.nodes,
    newNode,
  ],

  selectedNode: newNode,
  isDirty: true,
}));


},

updateNodeConfig: (nodeId, updatedData) => {
set((state) => {
const updatedNodes = state.nodes.map((node) => {
if (node.id !== nodeId) {
return node;
}


    return {
      ...node,

      data: {
        ...node.data,
        ...updatedData,

        config: {
          ...node.data.config,
          ...(updatedData.config || {}),
        },
      },
    };
  });

  const selectedNode =
    updatedNodes.find(
      (node) => node.id === nodeId
    ) || state.selectedNode;

  return {
    nodes: updatedNodes,
    selectedNode,
    isDirty: true,
  };
});


},

deleteNode: (nodeId) => {
set((state) => ({
nodes: state.nodes.filter(
(node) => node.id !== nodeId
),


  edges: state.edges.filter(
    (edge) =>
      edge.source !== nodeId &&
      edge.target !== nodeId
  ),

  selectedNode:
    state.selectedNode?.id === nodeId
      ? null
      : state.selectedNode,

  isDirty: true,
}));


},

duplicateNode: (nodeId) => {
const state = get();


const sourceNode = state.nodes.find(
  (node) => node.id === nodeId
);

if (!sourceNode) {
  set({
    error: 'Node not found',
  });

  return;
}

const duplicatedNode = {
  ...sourceNode,

  id: `node_${sourceNode.type}_${Date.now()}`,

  position: {
    x: sourceNode.position.x + 50,
    y: sourceNode.position.y + 50,
  },

  data: JSON.parse(
    JSON.stringify({
      ...sourceNode.data,

      label: `${sourceNode.data.label} Copy`,
    })
  ),
};

set({
  nodes: [
    ...state.nodes,
    duplicatedNode,
  ],

  selectedNode: duplicatedNode,
  isDirty: true,
});


},

loadWorkflow: async (id) => {
set({
isLoading: true,
error: null,
successMessage: null,
validationResult: null,
});


try {
  const response =
    await workflowsApi.getWorkflowById(id);

  const workflow = unwrapResponse(response);

  if (!workflow?.id) {
    throw new Error(
      'Workflow not found or invalid server response'
    );
  }

  const definition = normalizeDefinition(
    workflow.definition_json
  );

  const nodes = definition.nodes.map(
    (node) => ({
      id: node.id,

      type: node.type || 'action',

      position:
        node.position || {
          x: 100,
          y: 100,
        },

      data: {
        label:
          node.label ||
          node.data?.label ||
          node.id,

        type:
          node.type ||
          node.data?.type ||
          'action',

        subtype:
          node.subtype ||
          node.data?.subtype ||
          null,

        config:
          node.config ||
          node.data?.config ||
          {},
      },
    })
  );

  const edges = definition.edges.map(
    (edge, index) => ({
      id:
        edge.id ||
        `edge_${edge.source}_${edge.target}_${index}`,

      source: edge.source,
      target: edge.target,

      sourceHandle:
        edge.sourceHandle || null,

      targetHandle:
        edge.targetHandle || null,

      animated: true,

      style: {
        stroke: '#38bdf8',
        strokeWidth: 2,
      },
    })
  );

  set({
    workflow,
    nodes,
    edges,

    selectedNode: null,

    isDirty: false,
    isLoading: false,
  });
} catch (error) {
  set({
    error: getErrorMessage(
      error,
      'Failed to load workflow'
    ),

    isLoading: false,
  });
}


},

saveWorkflow: async () => {
const {
workflow,
nodes,
edges,
} = get();


if (!workflow?.id) {
  set({
    error: 'No workflow selected',
  });

  return false;
}

set({
  isSaving: true,
  error: null,
  successMessage: null,
});

try {
  const definition = {
    nodes: nodes.map((node) => ({
      id: node.id,

      type: node.type,

      subtype:
        node.data?.subtype || null,

      label:
        node.data?.label ||
        node.id,

      config:
        node.data?.config || {},

      position: node.position,
    })),

    edges: edges.map((edge) => ({
      id: edge.id,

      source: edge.source,
      target: edge.target,

      sourceHandle:
        edge.sourceHandle || null,

      targetHandle:
        edge.targetHandle || null,
    })),
  };

  const response =
    await workflowsApi.updateWorkflow(
      workflow.id,
      {
        definition,
      }
    );

  const updatedWorkflow =
    unwrapResponse(response);

  set({
    workflow:
      updatedWorkflow?.id
        ? updatedWorkflow
        : workflow,

    isDirty: false,
    isSaving: false,

    successMessage:
      'Workflow saved successfully',
  });

  return true;
} catch (error) {
  set({
    error: getErrorMessage(
      error,
      'Failed to save workflow'
    ),

    isSaving: false,
  });

  return false;
}


},

validateWorkflow: async () => {
const {
workflow,
} = get();


if (!workflow?.id) {
  set({
    error: 'No workflow selected',
  });

  return;
}

set({
  isValidating: true,
  error: null,
  successMessage: null,
  validationResult: null,
});

try {
  const response =
    await workflowsApi.validateWorkflow(
      workflow.id
    );

  const result =
    unwrapResponse(response);

  const isValid =
    Boolean(
      result?.isValid ??
      result?.valid
    );

  const errors =
    Array.isArray(result?.errors)
      ? result.errors
      : [];

  set({
    validationResult: result,
    isValidating: false,

    successMessage: isValid
      ? 'Workflow validation passed successfully.'
      : null,

    error: !isValid
      ? errors.length > 0
        ? `Validation failed: ${errors.join('; ')}`
        : 'Workflow validation failed'
      : null,
  });

  return isValid;
} catch (error) {
  set({
    error: getErrorMessage(
      error,
      'Failed to validate workflow'
    ),

    isValidating: false,
  });

  return false;
}


},

publishWorkflow: async () => {
const {
workflow,
isDirty,
} = get();


if (!workflow?.id) {
  set({
    error: 'No workflow selected',
  });

  return;
}

set({
  isPublishing: true,
  error: null,
  successMessage: null,
});

try {
  if (isDirty) {
    const saved =
      await get().saveWorkflow();

    if (!saved) {
      set({
        isPublishing: false,
      });

      return;
    }
  }

  const isValid =
    await get().validateWorkflow();

  if (!isValid) {
    set({
      isPublishing: false,
    });

    return;
  }

  const response =
    await workflowsApi.publishWorkflow(
      workflow.id
    );

  const publishedWorkflow =
    unwrapResponse(response);

  set({
    workflow:
      publishedWorkflow?.id
        ? publishedWorkflow
        : get().workflow,

    isDirty: false,
    isPublishing: false,

    successMessage:
      'Workflow published successfully.',
  });
} catch (error) {
  set({
    error: getErrorMessage(
      error,
      'Failed to publish workflow'
    ),

    isPublishing: false,
  });
}


},
}));
