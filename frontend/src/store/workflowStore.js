import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { workflowsApi } from '../services/workflowsApi';
import { getNodeMetadata } from '../features/builder/nodeTypes/nodeRegistry';

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
  validationResult: null,
  error: null,
  successMessage: null,

  setSuccessMessage: (msg) => set({ successMessage: msg }),
  setError: (err) => set({ error: err }),
  clearStatus: () => set({ error: null, successMessage: null }),

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
      edges: addEdge({ ...connection, animated: true, style: { stroke: '#38bdf8', strokeWidth: 2 } }, state.edges),
      isDirty: true,
    }));
  },

  selectNode: (node) => {
    set({ selectedNode: node });
  },

  addNode: (type, subtype, position = { x: 250, y: 250 }) => {
    const meta = getNodeMetadata(type, subtype);
    const id = `node_${type}_${Date.now()}`;

    const newNode = {
      id,
      type, // 'trigger' | 'condition' | 'action'
      position,
      data: {
        label: meta.label,
        type,
        subtype,
        config: { ...meta.defaultConfig },
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNode: newNode,
      isDirty: true,
    }));
  },

  updateNodeConfig: (nodeId, updatedData) => {
    set((state) => {
      const updatedNodes = state.nodes.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              ...updatedData,
            },
          };
        }
        return n;
      });

      const activeNode = updatedNodes.find((n) => n.id === nodeId);
      return {
        nodes: updatedNodes,
        selectedNode: activeNode || state.selectedNode,
        isDirty: true,
      };
    });
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
      isDirty: true,
    }));
  },

  duplicateNode: (nodeId) => {
    const state = get();
    const sourceNode = state.nodes.find((n) => n.id === nodeId);
    if (!sourceNode) return;

    const newId = `node_${sourceNode.type}_${Date.now()}`;
    const duplicatedNode = {
      ...sourceNode,
      id: newId,
      position: { x: sourceNode.position.x + 40, y: sourceNode.position.y + 40 },
      data: {
        ...JSON.parse(JSON.stringify(sourceNode.data)),
        label: `${sourceNode.data.label} (Copy)`,
      },
    };

    set({
      nodes: [...state.nodes, duplicatedNode],
      selectedNode: duplicatedNode,
      isDirty: true,
    });
  },

  loadWorkflow: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await workflowsApi.getWorkflowById(id);
      const wf = res.data;
      const def = wf.definition_json || { nodes: [], edges: [] };

      // Ensure nodes have proper React Flow visual structure
      const rfNodes = (def.nodes || []).map((n) => ({
        id: n.id,
        type: n.type || 'action',
        position: n.position || { x: 100, y: 100 },
        data: {
          label: n.label || n.id,
          type: n.type,
          subtype: n.subtype,
          config: n.config || {},
        },
      }));

      const rfEdges = (def.edges || []).map((e) => ({
        id: e.id || `e_${e.source}_${e.target}`,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || null,
        targetHandle: e.targetHandle || null,
        animated: true,
        style: { stroke: '#38bdf8', strokeWidth: 2 },
      }));

      set({
        workflow: wf,
        nodes: rfNodes,
        edges: rfEdges,
        isDirty: false,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
    }
  },

  saveWorkflow: async () => {
    const { workflow, nodes, edges } = get();
    if (!workflow) return;

    set({ isSaving: true, error: null });
    try {
      // Transform React Flow state to backend AST definition format
      const definition = {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          subtype: n.data.subtype,
          label: n.data.label,
          config: n.data.config || {},
          position: n.position,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle || null,
          targetHandle: e.targetHandle || null,
        })),
      };

      const res = await workflowsApi.updateWorkflow(workflow.id, { definition });
      set({
        workflow: res.data,
        isDirty: false,
        isSaving: false,
        successMessage: 'Workflow saved successfully',
      });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, isSaving: false });
    }
  },

  validateWorkflow: async () => {
    const { workflow } = get();
    if (!workflow) return;

    set({ isValidating: true, error: null });
    try {
      const res = await workflowsApi.validateWorkflow(workflow.id);
      set({
        validationResult: res.data,
        isValidating: false,
        successMessage: res.data.isValid ? 'Workflow graph is 100% valid!' : null,
        error: !res.data.isValid ? `Validation failed: ${res.data.errors.join('; ')}` : null,
      });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, isValidating: false });
    }
  },

  publishWorkflow: async () => {
    const { workflow } = get();
    if (!workflow) return;

    // Save first before publishing
    await get().saveWorkflow();

    set({ isPublishing: true, error: null });
    try {
      const res = await workflowsApi.publishWorkflow(workflow.id);
      set({
        workflow: res.data,
        isPublishing: false,
        successMessage: `Workflow version ${res.data.current_version - 1} published successfully!`,
      });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, isPublishing: false });
    }
  },
}));
