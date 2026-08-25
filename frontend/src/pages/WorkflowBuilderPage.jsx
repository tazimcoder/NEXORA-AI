import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkflowStore } from '../store/workflowStore';
import { WorkflowHeader } from '../features/builder/WorkflowHeader';
import { WorkflowCanvas } from '../features/builder/WorkflowCanvas';
import { AddNodeMenu } from '../features/builder/AddNodeMenu';
import { NodeConfigPanel } from '../features/builder/NodeConfigPanel';

export const WorkflowBuilderPage = () => {
  const { id } = useParams();
  const loadWorkflow = useWorkflowStore((state) => state.loadWorkflow);
  const isLoading = useWorkflowStore((state) => state.isLoading);
  const error = useWorkflowStore((state) => state.error);
  const successMessage = useWorkflowStore((state) => state.successMessage);
  const clearStatus = useWorkflowStore((state) => state.clearStatus);

  useEffect(() => {
    if (id) {
      loadWorkflow(id);
    }
  }, [id, loadWorkflow]);

  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => clearStatus(), 4000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage, clearStatus]);

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex justify-center items-center text-slate-400 font-bold text-lg">
        Loading Workflow Canvas...
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 overflow-hidden relative">
      <WorkflowHeader />

      <div className="flex-1 relative">
        <AddNodeMenu />
        <WorkflowCanvas />
        <NodeConfigPanel />
      </div>

      {/* Floating Status Notification Alerts */}
      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-rose-900/90 border border-rose-500 text-rose-100 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-sm font-semibold flex items-center gap-3">
          <span>⚠️ {error}</span>
          <button onClick={clearStatus} className="text-rose-300 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-900/90 border border-emerald-500 text-emerald-100 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-sm font-semibold flex items-center gap-3">
          <span>✔ {successMessage}</span>
          <button onClick={clearStatus} className="text-emerald-300 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
