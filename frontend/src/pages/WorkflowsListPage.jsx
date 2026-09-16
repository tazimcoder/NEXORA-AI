import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowsApi } from '../services/workflowsApi';
import { AIPromptModal } from '../features/ai/AIPromptModal';
import { authStore } from '../store/authStore';
import { LogOut, Shield, User, Zap, Search, Lock } from 'lucide-react';

const STARTER_TEMPLATES = [
  {
    id: 'template_telegram_alert',
    name: '🤖 Webhook to Telegram Incident Alert Bot',
    description: 'Listens for incoming HTTP webhooks, validates payload, and sends formatted instant alerts to Telegram.',
    category: 'DevOps & Alerts',
    icon: '🤖',
    color: 'from-sky-500/20 to-blue-600/20 border-sky-500/30',
    definition: {
      nodes: [
        { id: 'node-1', type: 'triggerNode', position: { x: 100, y: 150 }, data: { label: 'Webhook Event Listener', triggerType: 'webhook' } },
        { id: 'node-2', type: 'conditionNode', position: { x: 420, y: 150 }, data: { label: 'Severity Check (isError)', conditionType: 'if_else' } },
        { id: 'node-3', type: 'actionNode', position: { x: 740, y: 150 }, data: { label: 'Telegram Notification Bot', actionType: 'send_telegram', botToken: 'TEST_BOT_TOKEN', chatId: 'MY_CHANNEL' } },
      ],
      edges: [
        { id: 'e1-2', source: 'node-1', target: 'node-2' },
        { id: 'e2-3', source: 'node-2', target: 'node-3' },
      ],
    },
  },
  {
    id: 'template_slack_ai',
    name: '✨ AI Multi-Agent Summarizer & Slack Dispatcher',
    description: 'Processes complex text input via Autonomous Multi-Agent reasoning and posts structured summary to Slack.',
    category: 'AI & Automation',
    icon: '🧠',
    color: 'from-purple-500/20 to-indigo-600/20 border-purple-500/30',
    definition: {
      nodes: [
        { id: 'node-1', type: 'triggerNode', position: { x: 100, y: 150 }, data: { label: 'Manual Trigger', triggerType: 'manual' } },
        { id: 'node-2', type: 'actionNode', position: { x: 420, y: 150 }, data: { label: 'OpenRouter LLM Agent', actionType: 'custom_api' } },
        { id: 'node-3', type: 'actionNode', position: { x: 740, y: 150 }, data: { label: 'Slack Notification', actionType: 'post_slack', webhookUrl: 'https://hooks.slack.com/services/demo' } },
      ],
      edges: [
        { id: 'e1-2', source: 'node-1', target: 'node-2' },
        { id: 'e2-3', source: 'node-2', target: 'node-3' },
      ],
    },
  },
];

export const WorkflowsListPage = () => {
  const navigate = useNavigate();

  const [authState, setAuthState] = useState(() => authStore.getState());
  const [workflows, setWorkflows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = authStore.subscribe((state) => {
      setAuthState(state);
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    authStore.logout();
    navigate('/login', { replace: true });
  };

  const loadList = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const workflowsList = await workflowsApi.getWorkflows();

      setWorkflows(
        Array.isArray(workflowsList)
          ? workflowsList
          : []
      );
    } catch (err) {
      console.error('Failed to load workflows:', err);

      setError(
        err.message || 'Failed to load workflows'
      );

      setWorkflows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      return;
    }

    try {
      setError(null);

      const workflow = await workflowsApi.createWorkflow({
        name: newTitle.trim(),
        description: newDesc.trim(),
      });

      if (!workflow?.id) {
        throw new Error(
          'Workflow was created, but the server did not return a workflow ID'
        );
      }

      setIsCreating(false);
      setNewTitle('');
      setNewDesc('');

      navigate(`/workflows/${workflow.id}`);
    } catch (err) {
      console.error('Failed to create workflow:', err);

      const message =
        err.message || 'Failed to create workflow';

      setError(message);
      alert(`Failed to create workflow: ${message}`);
    }
  };

  const handleCreateFromTemplate = async (template) => {
    try {
      setError(null);
      setIsLoading(true);
      const created = await workflowsApi.createWorkflow({
        name: template.name.replace(/^[^\s]+\s/, ''),
        description: template.description,
        definition: template.definition,
      });
      if (created?.id) {
        navigate(`/workflows/${created.id}`);
      }
    } catch (err) {
      console.error('Failed to launch template:', err);
      setError('Failed to launch blueprint template: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors = {
    draft:
      'bg-amber-500/20 text-amber-400 border-amber-500/30',

    published:
      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',

    paused:
      'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  const currentUser = authState.user;
  const isAdmin = currentUser?.role === 'admin';

  // Filter workflows by search & status filter
  const filteredWorkflows = workflows.filter((wf) => {
    const matchesSearch = (wf.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (wf.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || wf.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* User Navigation Header Bar */}
        <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-6 py-3.5 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Zap className="w-5 h-5 fill-brand-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">NEXORA AI</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> AES-256 Secure
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                {authState.activeWorkspace?.name || 'Workspace'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Badge */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-200 font-medium max-w-[140px] truncate">
                {currentUser?.email || 'User'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                isAdmin
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
              }`}>
                {currentUser?.role || 'user'}
              </span>
            </div>

            {/* Admin Panel Link (Only visible if user is Admin) */}
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-semibold px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Live System Telemetry Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-lg">
              ⚡
            </div>
            <div>
              <div className="text-xl font-bold text-white">{workflows.length}</div>
              <div className="text-[11px] text-slate-400 font-medium">Active Blueprints</div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">
              🎯
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-400">99.4%</div>
              <div className="text-[11px] text-slate-400 font-medium">Execution Health</div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-lg">
              🤖
            </div>
            <div>
              <div className="text-xl font-bold text-purple-300">5 Agents</div>
              <div className="text-[11px] text-slate-400 font-medium">Multi-Agent Engine</div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg">
              🛡️
            </div>
            <div>
              <div className="text-xl font-bold text-amber-300">Self-Healing</div>
              <div className="text-[11px] text-slate-400 font-medium">Auto-Recovery Active</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Workflows & Automation Blueprints
            </h1>

            <p className="text-slate-400 text-sm mt-1">
              Design, execute, and monitor modular AI workflow blueprints with autonomous self-healing.
            </p>
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
              ✚ Create Blank Blueprint
            </button>
          </div>
        </div>

        {/* One-Click Starter Templates Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
              <span>🚀</span> One-Click Starter Blueprints
            </h2>
            <span className="text-[11px] text-slate-400">Launch instant pre-built AI automation templates</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STARTER_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => handleCreateFromTemplate(tmpl)}
                className={`bg-slate-900/70 hover:bg-slate-900 border ${tmpl.color} rounded-2xl p-5 transition-all cursor-pointer group shadow-lg flex items-start gap-4 hover:scale-[1.01]`}
              >
                <div className="text-3xl p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  {tmpl.icon}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors">
                      {tmpl.name}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {tmpl.category}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {tmpl.description}
                  </p>
                  <div className="pt-2 text-[11px] font-bold text-sky-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Launch Template Canvas</span> &rarr;
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Search & Status Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800/60">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workflows..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {['all', 'published', 'draft'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
            <span>{error}</span>

            <button
              onClick={() => setError(null)}
              className="text-rose-300 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20 text-slate-400 font-medium">
            Loading workflows...
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <div className="text-4xl">⚡</div>

            <h3 className="text-lg font-bold text-white">
              No workflows found
            </h3>

            <p className="text-slate-400 text-sm max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'No workflow matched your search or status filter criteria.'
                : 'Build your first automated workflow using our visual canvas or select one of the starter templates above.'}
            </p>

            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); setIsCreating(true); }}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-all"
            >
              Create Workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((wf) => (
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
                        statusColors[wf.status] ||
                        'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {wf.status || 'draft'}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs line-clamp-2 mb-4">
                    {wf.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 font-mono">
                  <span>
                    v{wf.current_version || 1}
                  </span>

                  <span>
                    {wf.updated_at
                      ? new Date(
                          wf.updated_at
                        ).toLocaleDateString()
                      : 'Recently created'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <h3 className="text-xl font-bold text-white">
              Create New Workflow
            </h3>

            <form
              onSubmit={handleCreate}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Workflow Name
                </label>

                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) =>
                    setNewTitle(e.target.value)
                  }
                  placeholder="e.g. Lead Qualification & Email Alert"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Description (Optional)
                </label>

                <textarea
                  value={newDesc}
                  onChange={(e) =>
                    setNewDesc(e.target.value)
                  }
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

      <AIPromptModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />
    </div>
  );
};