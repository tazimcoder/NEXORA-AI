import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowsApi } from '../services/workflowsApi';
import { AIPromptModal } from '../features/ai/AIPromptModal';

export const WorkflowsListPage = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const loadList = async () => {
    setIsLoading(true);
    try {
      const res = await workflowsApi.getWorkflows();
      setWorkflows(res.data || []);
    } catch (err) {
      console.error('Failed to load workflows:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await workflowsApi.createWorkflow({
        name: newTitle.trim(),
        description: newDesc.trim(),
      });
      setIsCreating(false);
      navigate(`/workflows/${res.data.id}`);
    } catch (err) {
      alert('Failed to create workflow: ' + (err.response?.data?.message || err.message));
    }
  };

  const statusColors = {
    draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    published: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    paused: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Workflows</h1>
            <p className="text-slate-400 text-sm mt-1">Design, automate, and manage modular AI workflow blueprints.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-purple-500/25 transition-all active:scale-95 text-sm"
            >
              ✨ AI Automation Generator
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/25 transition-all active:scale-95 text-sm"
            >
              ✚ Create Workflow
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20 text-slate-400 font-medium">Loading workflows...</div>
        ) : workflows.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <div className="text-4xl">⚡</div>
            <h3 className="text-lg font-bold text-white">No workflows created yet</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Build your first automated workflow using our drag-and-drop visual canvas.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-all"
            >
              Create First Workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                onClick={() => navigate(`/workflows/${wf.id}`)}
                className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 transition-all cursor-pointer group shadow-xl hover:shadow-sky-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="font-bold text-lg text-white group-hover:text-sky-400 transition-colors line-clamp-1">
                      {wf.name}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        statusColors[wf.status] || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {wf.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2 mb-4">
                    {wf.description || 'No description provided.'}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 font-mono">
                  <span>v{wf.current_version || 1}</span>
                  <span>{new Date(wf.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <h3 className="text-xl font-bold text-white">Create New Workflow</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Workflow Name</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Lead Qualification & Email Alert"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description (Optional)</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="What does this workflow do?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition-all"
                >
                  Create & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* AI Prompt Modal */}
      <AIPromptModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
    </div>
  );
};
