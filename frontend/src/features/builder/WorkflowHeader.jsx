import React from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { useNavigate } from 'react-router-dom';

export const WorkflowHeader = () => {
  const navigate = useNavigate();
  const workflow = useWorkflowStore((state) => state.workflow);
  const isDirty = useWorkflowStore((state) => state.isDirty);
  const isSaving = useWorkflowStore((state) => state.isSaving);
  const isPublishing = useWorkflowStore((state) => state.isPublishing);
  const isValidating = useWorkflowStore((state) => state.isValidating);
  const saveWorkflow = useWorkflowStore((state) => state.saveWorkflow);
  const publishWorkflow = useWorkflowStore((state) => state.publishWorkflow);
  const validateWorkflow = useWorkflowStore((state) => state.validateWorkflow);

  const isExecuting = useWorkflowStore((state) => state.isExecuting);
  const executeWorkflow = useWorkflowStore((state) => state.executeWorkflow);

  if (!workflow) return null;

  const statusColors = {
    draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    published: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    paused: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  return (
    <div className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/workflows')}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-all"
        >
          ← Back
        </button>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-bold text-lg text-white leading-tight">{workflow.name}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                statusColors[workflow.status] || 'bg-slate-800 text-slate-300'
              }`}
            >
              {workflow.status}
            </span>
            {isDirty && <span className="text-xs font-semibold text-amber-400 font-mono">(Unsaved changes)</span>}
          </div>
          <p className="text-xs text-slate-400 font-medium truncate max-w-md">
            {workflow.description || 'Modular automated AI workflow'} • Version {workflow.current_version || 1}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={executeWorkflow}
          disabled={isExecuting}
          className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 active:scale-95 flex items-center gap-1.5 animate-pulse"
          title="Run Real-Time AI Workflow Notification Execution"
        >
          <span>{isExecuting ? '⚡ Running & Sending...' : '▶️ Test Run & Send Alert'}</span>
        </button>

        <button
          onClick={validateWorkflow}
          disabled={isValidating}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
        >
          {isValidating ? 'Validating...' : '🔍 Validate'}
        </button>

        <button
          onClick={saveWorkflow}
          disabled={isSaving || !isDirty}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : '💾 Save Draft'}
        </button>

        <button
          onClick={publishWorkflow}
          disabled={isPublishing}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 active:scale-95"
        >
          {isPublishing ? 'Publishing...' : '🚀 Publish Version'}
        </button>
      </div>
    </div>
  );
};
