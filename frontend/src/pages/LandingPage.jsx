import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Bot,
  ShieldCheck,
  Workflow,
  Cpu,
  Database,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Layers,
  Activity,
  Lock,
  Code2,
  Terminal,
  Globe,
  ChevronRight,
  Play,
  RefreshCw,
  Sliders,
  GitBranch,
  FileText,
  MessageSquare,
  Send,
  Server,
  Github,
  ExternalLink
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeAgentTab, setActiveAgentTab] = useState('research');

  const agentDetails = {
    research: {
      title: 'Research Agent',
      icon: SearchIcon,
      color: 'from-blue-500 to-cyan-400',
      badge: 'Data Extraction & Web Research',
      description: 'Scrapes web sources, extracts structured documentation, and performs contextual deep-dives to gather accurate real-time payload data.',
      capabilities: ['Autonomous Web Scraping', 'Contextual Summary Generation', 'Source Attribution', 'Raw Payload Filtering']
    },
    data: {
      title: 'Data Analysis Agent',
      icon: Cpu,
      color: 'from-purple-500 to-pink-500',
      badge: 'JSON & Metric Structuring',
      description: 'Analyzes complex nested JSON structures, performs statistical aggregation, and transforms raw API responses into clean execution payloads.',
      capabilities: ['Schema Mapping & Validation', 'JSON Path Evaluation', 'Metric Aggregation', 'Type Transformation']
    },
    workflow: {
      title: 'Workflow Agent',
      icon: Workflow,
      color: 'from-indigo-500 to-violet-400',
      badge: 'DAG Topology Construction',
      description: 'Parses natural language prompts and automatically constructs valid Directed Acyclic Graphs (DAGs) with topological node ordering.',
      capabilities: ['Natural Language to AST', 'Topological Sort Verification', 'Edge Validation', 'Node Configuration']
    },
    action: {
      title: 'Action Agent',
      icon: Send,
      color: 'from-amber-500 to-orange-400',
      badge: 'Integration Execution',
      description: 'Dispatches authenticated HTTP requests, posts Telegram & Slack alerts, triggers webhooks, and manages external API rate limits.',
      capabilities: ['Telegram & Slack Bots', 'Universal REST API Requests', 'OAuth & API Key Injection', 'Webhook Dispatching']
    },
    review: {
      title: 'Review Agent',
      icon: ShieldCheck,
      color: 'from-emerald-500 to-teal-400',
      badge: 'QA & Human Escalation',
      description: 'Monitors workflow safety, validates node execution outputs against schemas, and triggers Human-in-the-Loop approval when required.',
      capabilities: ['Schema Safety Auditing', 'Human Approval Escalation', 'Execution Verification', 'Audit Trail Logging']
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-gray-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Glow Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]"></div>
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-purple-600/15 rounded-full blur-[160px]"></div>
        <div className="absolute -bottom-40 left-1/3 w-[36rem] h-[36rem] bg-cyan-600/15 rounded-full blur-[160px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#090D16]/80 border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 shadow-lg shadow-indigo-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                NEXORA<span className="text-indigo-400">.AI</span>
              </span>
              <span className="block text-[10px] tracking-widest text-indigo-400 uppercase font-semibold">
                Autonomous Workflow Platform
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
            <a href="#agents" className="hover:text-indigo-400 transition-colors">AI Agents</a>
            <a href="#architecture" className="hover:text-indigo-400 transition-colors">Architecture</a>
            <a href="#integrations" className="hover:text-indigo-400 transition-colors">Integrations</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/tazimcoder/NEXORA-AI"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700/80 bg-gray-900/60 hover:bg-gray-800 text-sm font-medium text-gray-300 hover:text-white transition-all"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>

            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </button>

            <button
              onClick={() => navigate('/login')}
              className="relative group px-5 py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 group-hover:opacity-90 transition-opacity"></div>
              <span className="relative flex items-center gap-2">
                <span>Launch Canvas</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-8 backdrop-blur-md animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Autonomous Multi-Agent Workflow Engine v2.4</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.15]">
            Automate Any Workflow with{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Autonomous AI Agents
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto font-normal leading-relaxed">
            Build, execute, and self-heal complex multi-step automation DAGs using natural language prompts or a visual drag-and-drop node canvas. Powered by Redis queues and 5 collaborative AI agents.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-xl shadow-indigo-600/30 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
            >
              <span>Start Building Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-gray-300 border border-gray-800 bg-gray-900/60 hover:bg-gray-800 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-indigo-400 fill-indigo-400" />
              <span>See Architecture</span>
            </a>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="glass-panel p-5 rounded-2xl border border-gray-800 text-left">
              <div className="text-3xl font-extrabold text-white">10x</div>
              <div className="text-xs text-gray-400 mt-1">Faster Automation Setup</div>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-gray-800 text-left">
              <div className="text-3xl font-extrabold text-indigo-400">5 AI Agents</div>
              <div className="text-xs text-gray-400 mt-1">Autonomous Collaboration</div>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-gray-800 text-left">
              <div className="text-3xl font-extrabold text-emerald-400">99.9%</div>
              <div className="text-xs text-gray-400 mt-1">Self-Healing Uptime</div>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-gray-800 text-left">
              <div className="text-3xl font-extrabold text-cyan-400">&lt;50ms</div>
              <div className="text-xs text-gray-400 mt-1">Node Processing Time</div>
            </div>
          </div>

          {/* INTERACTIVE WORKFLOW CANVAS MOCKUP PREVIEW */}
          <div className="mt-16 max-w-5xl mx-auto glass-panel p-4 sm:p-6 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden group">
            {/* Window bar */}
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <span className="text-xs font-mono text-gray-500 ml-2">NEXORA Visual Workflow Canvas — DAG #9204</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-medium border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Execution Active
                </span>
              </div>
            </div>

            {/* Canvas Node Pipeline Mock */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative py-6">
              {/* Connection Beam Line (Desktop) */}
              <div className="hidden md:block absolute top-1/2 left-10 right-10 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 -translate-y-1/2 opacity-40 z-0"></div>

              {/* Node 1: Trigger */}
              <div className="relative z-10 glass-card p-4 rounded-xl border border-indigo-500/40 text-left bg-gray-900/90 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    Trigger
                  </span>
                  <Zap className="w-4 h-4 text-indigo-400" />
                </div>
                <h4 className="text-sm font-bold text-white">Webhook Listener</h4>
                <p className="text-xs text-gray-400 mt-1">HTTP POST /api/v1/hooks</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-400 border-t border-gray-800 pt-2">
                  <span>Status: 200 OK</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Node 2: AI Summarizer */}
              <div className="relative z-10 glass-card p-4 rounded-xl border border-purple-500/40 text-left bg-gray-900/90 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    AI Agent
                  </span>
                  <Bot className="w-4 h-4 text-purple-400 animate-bounce" />
                </div>
                <h4 className="text-sm font-bold text-white">Research Agent</h4>
                <p className="text-xs text-gray-400 mt-1">Summarize API Payload</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-purple-300 border-t border-gray-800 pt-2">
                  <span>Tokens: 342 tokens</span>
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                </div>
              </div>

              {/* Node 3: Condition */}
              <div className="relative z-10 glass-card p-4 rounded-xl border border-cyan-500/40 text-left bg-gray-900/90 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                    Logic
                  </span>
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                </div>
                <h4 className="text-sm font-bold text-white">Priority Filter</h4>
                <p className="text-xs text-gray-400 mt-1">If priority == 'HIGH'</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-cyan-300 border-t border-gray-800 pt-2">
                  <span>Result: TRUE</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                </div>
              </div>

              {/* Node 4: Action */}
              <div className="relative z-10 glass-card p-4 rounded-xl border border-emerald-500/40 text-left bg-gray-900/90 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Action
                  </span>
                  <Send className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-sm font-bold text-white">Telegram Notification</h4>
                <p className="text-xs text-gray-400 mt-1">Send Alert to Channel</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-400 border-t border-gray-800 pt-2">
                  <span>Delivered</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Core Features</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Built for Next-Generation Automation
            </p>
            <p className="mt-4 text-gray-400">
              Everything you need to orchestrate complex background tasks, manage APIs, and recover from failures automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="glass-card p-8 rounded-2xl border border-gray-800 hover:border-indigo-500/40 relative group">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-5 group-hover:scale-110 transition-transform">
                <Workflow className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Visual Drag & Drop Canvas</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Construct Directed Acyclic Graphs (DAGs) seamlessly with `@xyflow/react`. Link triggers, conditions, and action nodes with topological evaluation.
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass-card p-8 rounded-2xl border border-gray-800 hover:border-purple-500/40 relative group">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-5 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">5-Agent AI Orchestrator</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Delegates complex prompts across 5 specialized autonomous agents (Research, Analysis, Workflow, Action, and Review) for high accuracy execution.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass-card p-8 rounded-2xl border border-gray-800 hover:border-emerald-500/40 relative group">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-5 group-hover:scale-110 transition-transform">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Self-Healing Recovery</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Categorizes API failures into 6 error types. Performs automatic exponential backoff retries and triggers Human-in-the-Loop escalations when needed.
              </p>
            </div>

            {/* Card 4 */}
            <div className="glass-card p-8 rounded-2xl border border-gray-800 hover:border-cyan-500/40 relative group">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit mb-5 group-hover:scale-110 transition-transform">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Distributed Queue Engine</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Powered by a standalone Node.js worker daemon listening to BullMQ & Redis queues. Executes heavy background jobs asynchronously with zero blocking.
              </p>
            </div>

            {/* Card 5 */}
            <div className="glass-card p-8 rounded-2xl border border-gray-800 hover:border-amber-500/40 relative group">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 w-fit mb-5 group-hover:scale-110 transition-transform">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Universal Integrations</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Connect Telegram, Slack, Webhooks, Google Sheets, Gmail, and custom HTTP REST APIs with encrypted headers and parameter injection.
              </p>
            </div>

            {/* Card 6 */}
            <div className="glass-card p-8 rounded-2xl border border-gray-800 hover:border-red-500/40 relative group">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-400 w-fit mb-5 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AES-256 Key Vault</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Multi-tenant workspace isolation with RBAC controls, JWT lifecycle, and hardware-grade AES-256-GCM encryption for third-party credentials.
              </p>
            </div>
          </div>
        </section>

        {/* AI AGENTS INTERACTIVE TAB SHOWCASE */}
        <section id="agents" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-gray-800">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">Multi-Agent System</h2>
              <p className="text-3xl font-extrabold text-white">5 Autonomous Agents Working in Harmony</p>
            </div>

            {/* Agent Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
              {Object.keys(agentDetails).map((key) => {
                const agent = agentDetails[key];
                const isActive = activeAgentTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveAgentTab(key)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/30'
                        : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <span>{agent.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Agent Display Card */}
            {activeAgentTab && (
              <div className="glass-card p-6 sm:p-8 rounded-2xl border border-indigo-500/30 bg-gray-900/80 text-left">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {agentDetails[activeAgentTab].badge}
                    </span>
                    <h3 className="text-2xl font-bold text-white mt-2">
                      {agentDetails[activeAgentTab].title}
                    </h3>
                  </div>
                </div>

                <p className="text-gray-300 text-base leading-relaxed mb-6">
                  {agentDetails[activeAgentTab].description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-gray-800 pt-6">
                  {agentDetails[activeAgentTab].capabilities.map((cap, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ARCHITECTURE & TECH STACK */}
        <section id="architecture" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">System Architecture</h2>
            <p className="text-3xl font-extrabold text-white">Built with Industry-Leading Tech Stack</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-gray-800 text-center">
              <Code2 className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-white">React 18 & Vite</div>
              <div className="text-[11px] text-gray-400 mt-1">Single Page SPA</div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-gray-800 text-center">
              <Terminal className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-white">Node.js 22</div>
              <div className="text-[11px] text-gray-400 mt-1">Express API Engine</div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-gray-800 text-center">
              <Database className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-white">MySQL 8.0</div>
              <div className="text-[11px] text-gray-400 mt-1">Relational Database</div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-gray-800 text-center">
              <Activity className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-white">Redis 7 & BullMQ</div>
              <div className="text-[11px] text-gray-400 mt-1">Distributed Queue</div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-gray-800 text-center">
              <Workflow className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-white">React Flow v12</div>
              <div className="text-[11px] text-gray-400 mt-1">DAG Visual Nodes</div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-gray-800 text-center">
              <ShieldCheck className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-white">AES-256-GCM</div>
              <div className="text-[11px] text-gray-400 mt-1">Credential Security</div>
            </div>
          </div>
        </section>

        {/* CTA CALLOUT FOOTER */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden p-10 sm:p-16 text-center border border-indigo-500/30 bg-gradient-to-br from-indigo-950/80 via-purple-950/40 to-gray-950">
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Ready to Experience Next-Gen Automation?
              </h2>
              <p className="mt-4 text-gray-300 text-base sm:text-lg">
                Explore NEXORA AI's interactive visual workflow builder and multi-agent orchestration platform.
              </p>
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-xl shadow-indigo-600/30 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3"
                >
                  <span>Launch NEXORA Platform</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 py-10 px-4 text-center text-xs text-gray-500 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-gray-300">NEXORA AI</span>
            <span>— Production Ready Multi-Agent Platform</span>
          </div>
          <div>
            Built with React 18, Vite, Node.js, Redis, and MySQL.
          </div>
        </div>
      </footer>
    </div>
  );
}

function SearchIcon(props) {
  return <Bot {...props} />;
}
