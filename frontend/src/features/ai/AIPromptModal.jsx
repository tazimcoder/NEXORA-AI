import React, { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export const AIPromptModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('Every Monday check pending customers and send them a reminder email.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [error, setError] = useState(null);
  const [isApproving, setIsApproving] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setProposal(null);

    try {
      const res = await api.post('/ai/generate-plan', { prompt: prompt.trim() });
      setProposal(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!proposal) return;

    setIsApproving(true);
    setError(null);

    try {
      const res = await api.post('/ai/approve-plan', proposal.workflowProposal);
      onClose();
      navigate(`/workflows/${res.data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-6 text-white max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 text-xl font-bold">✨</span>
            <div>
              <h3 className="text-lg font-extrabold">AI Natural Language Planner</h3>
              <p className="text-xs text-slate-400">Describe your automation intent in plain language</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-lg">
            ✕
          </button>
        </div>

        {!proposal ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Automation Goal</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                required
                placeholder="e.g. Every Monday check pending customers and send them a reminder email."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-purple-500 font-medium"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
                ⚠️ {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
              >
                {isGenerating ? 'Analyzing Intent...' : '✨ Generate AI Plan Preview'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="p-4 bg-slate-950/80 border border-purple-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Validated AI Proposal</span>
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ✔ 100% Graph Valid
                </span>
              </div>
              <h4 className="text-base font-bold text-white">{proposal.workflowProposal.name}</h4>
              <p className="text-xs text-slate-400">{proposal.workflowProposal.description}</p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Proposed Workflow Graph Nodes</div>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {proposal.workflowProposal.definition.nodes.map((node) => (
                  <div key={node.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 mr-2">
                        {node.type}
                      </span>
                      <span className="text-xs font-bold text-white">{node.label}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{node.subtype}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button
                onClick={() => setProposal(null)}
                className="text-xs text-slate-400 hover:text-white font-bold"
              >
                ← Back to Edit Prompt
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Reject Proposal
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {isApproving ? 'Saving Workflow...' : '✔ Approve & Launch Builder'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
