import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '../../store/workflowStore';
import { TriggerNode } from './nodeTypes/TriggerNode';
import { ConditionNode } from './nodeTypes/ConditionNode';
import { ActionNode } from './nodeTypes/ActionNode';

export const WorkflowCanvas = () => {
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
  const onConnect = useWorkflowStore((state) => state.onConnect);
  const selectNode = useWorkflowStore((state) => state.selectNode);

  const nodeTypes = useMemo(
    () => ({
      trigger: TriggerNode,
      condition: ConditionNode,
      action: ActionNode,
    }),
    []
  );

  return (
    <div className="w-full h-full bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node)}
        onPaneClick={() => selectNode(null)}
        fitView
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#334155" />
        <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300 rounded-xl overflow-hidden shadow-2xl" />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'trigger') return '#0284c7';
            if (n.type === 'condition') return '#d97706';
            return '#059669';
          }}
          className="!bg-slate-900/90 !border-slate-800 rounded-xl overflow-hidden shadow-2xl"
        />
      </ReactFlow>
    </div>
  );
};
