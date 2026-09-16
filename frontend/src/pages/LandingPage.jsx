import React, { useState, useEffect } from 'react';
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
  Pause,
  RotateCcw,
  RefreshCw,
  Sliders,
  GitBranch,
  FileText,
  MessageSquare,
  Send,
  Server,
  Github,
  ExternalLink,
  BookOpen,
  UserCheck,
  Key,
  BarChart3,
  HelpCircle,
  X,
  Menu,
  Copy,
  Check,
  LayoutDashboard,
  PlusCircle,
  SlidersHorizontal,
  AlertTriangle
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  // Mobile menu drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Simulator state
  const [simPlaying, setSimPlaying] = useState(true);
  const [simStep, setSimStep] = useState(0); // 0: Idle, 1: Trigger, 2: AI Agent, 3: Filter, 4: Action, 5: Done
  const [simLogs, setSimLogs] = useState([]);

  // Active Flow Diagram Tab state
  const [activeDiagramFlow, setActiveDiagramFlow] = useState('prompt');

  // Agent tab state
  const [activeAgentTab, setActiveAgentTab] = useState('research');

  // Modal State
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Auto-advance simulator step when playing
  useEffect(() => {
    let timer;
    if (simPlaying) {
      timer = setInterval(() => {
        setSimStep((prev) => {
          const next = (prev % 5) + 1;

          // Append simulated logs based on step
          if (next === 1) {
            setSimLogs([
              `[${new Date().toLocaleTimeString()}] ⚡ TRIGGER: Webhook received POST /api/v1/hooks (200 OK)`
            ]);
          } else if (next === 2) {
            setSimLogs((logs) => [
              ...logs,
              `[${new Date().toLocaleTimeString()}] 🤖 AI AGENT: Research Agent parsed 340 tokens, summarized payload`
            ]);
          } else if (next === 3) {
            setSimLogs((logs) => [
              ...logs,
              `[${new Date().toLocaleTimeString()}] 🔀 LOGIC: Priority Filter evaluated (severity == 'HIGH') -> PASSED`
            ]);
          } else if (next === 4) {
            setSimLogs((logs) => [
              ...logs,
              `[${new Date().toLocaleTimeString()}] 📤 ACTION: Telegram Bot dispatched alert to @my_ops_alerts`
            ]);
          } else if (next === 5) {
            setSimLogs((logs) => [
              ...logs,
              `[${new Date().toLocaleTimeString()}] ✅ WORKFLOW COMPLETED: Total latency 142ms. Telemetry recorded.`
            ]);
          }

          return next;
        });
      }, 2200);
    }
    return () => clearInterval(timer);
  }, [simPlaying]);

  const handleResetSim = () => {
    setSimStep(1);
    setSimLogs([
      `[${new Date().toLocaleTimeString()}] ⚡ TRIGGER: Webhook received POST /api/v1/hooks (200 OK)`
    ]);
  };

  const steps = [
    {
      id: 1,
      stepNumber: '01',
      title: 'Account & Workspace Setup',
      icon: UserCheck,
      color: 'from-indigo-500 via-purple-500 to-pink-500',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      summary: 'Register account & select workspace.',
      description: 'Sign in to NEXORA AI and create your workspace. Workspace isolation ensures your team workflows, API keys, and execution logs are securely segmented with Role-Based Access Control (RBAC).',
      codeSnippet: `// 1. Register Account / Login
POST /api/v1/auth/register
Payload: { "email": "user@domain.com", "password": "••••••••" }

// 2. Active Workspace Token Injection
Header: x-workspace-id: ws_prod_94028`,
      details: [
        'JWT Token auto-injected into request headers',
        'AES-256 encrypted credential vault per workspace',
        'Role-Based Access Control (Admin, Member, Viewer)'
      ]
    },
    {
      id: 2,
      stepNumber: '02',
      title: 'Build Canvas or Prompt AI',
      icon: Workflow,
      color: 'from-cyan-400 via-blue-500 to-indigo-600',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      summary: 'Drag & drop visual nodes OR generate graph via LLM prompt.',
      description: 'Choose your Trigger node (Webhook, Schedule, or Manual) and link Action nodes (HTTP Request, Telegram, Slack). Alternatively, type a natural language prompt and let AI generate the full DAG topology!',
      codeSnippet: `// Natural Language AI Prompt Example:
"Create a workflow that listens on Webhook, 
 summarizes data with AI Agent, and posts 
 high-priority alerts to Telegram Channel."`,
      details: [
        'React Flow v12 canvas with topological node links',
        'AI Prompt Generator builds JSON AST in seconds',
        'Supports conditional IF/ELSE branching nodes'
      ]
    },
    {
      id: 3,
      stepNumber: '03',
      title: 'Configure Credentials & Variables',
      icon: Key,
      color: 'from-amber-400 via-orange-500 to-red-500',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      summary: 'Inject encrypted secrets & map variables.',
      description: 'Store API tokens securely in the encrypted vault. Pass data between nodes using template expressions like {{node_1.output.summary}} or {{webhook.body.email}} seamlessly.',
      codeSnippet: `// Dynamic Data Mapping Syntax:
{
  "chat_id": "@my_telegram_channel",
  "text": "Alert: {{node_2.output.summary}}",
  "status": "{{node_1.output.statusCode}}"
}`,
      details: [
        'Hardware-grade AES-256-GCM credential encryption',
        'Dynamic JSON variable resolution engine',
        'Header & OAuth token auto-injection'
      ]
    },
    {
      id: 4,
      stepNumber: '04',
      title: 'Run Execution & Watch Self-Healing',
      icon: Play,
      color: 'from-emerald-400 via-teal-500 to-cyan-600',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      summary: 'Trigger execution & automatic failure recovery.',
      description: 'Click "Run Workflow". The BullMQ + Redis background worker evaluates nodes in topological order. If a downstream API fails (e.g. HTTP 502), the Self-Healing engine executes exponential retries automatically!',
      codeSnippet: `// Execution Response Payload:
{
  "executionId": "exec_8402",
  "status": "COMPLETED",
  "selfHealing": { "attempts": 2, "recovered": true },
  "durationMs": 142
}`,
      details: [
        'Topological DAG sorting (Step 1 ➔ Step 2 ➔ Step 3)',
        'Exponential Backoff Retries on network errors',
        'Human-in-the-Loop escalation on auth failures'
      ]
    },
    {
      id: 5,
      stepNumber: '05',
      title: 'Inspect Telemetry & Audit Logs',
      icon: BarChart3,
      color: 'from-rose-400 via-pink-500 to-purple-600',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      summary: 'Monitor node performance & audit trails.',
      description: 'Review real-time execution logs, node input/output payloads, response times, error classification, and audit events across your entire workspace.',
      codeSnippet: `// Step Telemetry Log:
[INFO] Node: webhook_trigger -> Completed (200 OK)
[INFO] Node: ai_summarizer  -> Processed 340 tokens
[SUCCESS] Node: telegram_bot -> Delivered (Message ID #920)`,
      details: [
        'Real-time WebSockets log streaming',
        'Node-level execution telemetry & timing',
        'Full audit trail for compliance'
      ]
    }
  ];

  const agentDetails = {
    research: {
      title: 'Research Agent',
      badge: 'Data Extraction & Web Research',
      description: 'Scrapes web sources, extracts structured documentation, and performs contextual deep-dives to gather accurate real-time payload data.',
      capabilities: ['Autonomous Web Scraping', 'Contextual Summary Generation', 'Source Attribution', 'Raw Payload Filtering']
    },
    data: {
      title: 'Data Analysis Agent',
      badge: 'JSON & Metric Structuring',
      description: 'Analyzes complex nested JSON structures, performs statistical aggregation, and transforms raw API responses into clean execution payloads.',
      capabilities: ['Schema Mapping & Validation', 'JSON Path Evaluation', 'Metric Aggregation', 'Type Transformation']
    },
    workflow: {
      title: 'Workflow Agent',
      badge: 'DAG Topology Construction',
      description: 'Parses natural language prompts and automatically constructs valid Directed Acyclic Graphs (DAGs) with topological node ordering.',
      capabilities: ['Natural Language to AST', 'Topological Sort Verification', 'Edge Validation', 'Node Configuration']
    },
    action: {
      title: 'Action Agent',
      badge: 'Integration Execution',
      description: 'Dispatches authenticated HTTP requests, posts Telegram & Slack alerts, triggers webhooks, and manages external API rate limits.',
      capabilities: ['Telegram & Slack Bots', 'Universal REST API Requests', 'OAuth & API Key Injection', 'Webhook Dispatching']
    },
    review: {
      title: 'Review Agent',
      badge: 'QA & Human Escalation',
      description: 'Monitors workflow safety, validates node execution outputs against schemas, and triggers Human-in-the-Loop approval when required.',
      capabilities: ['Schema Safety Auditing', 'Human Approval Escalation', 'Execution Verification', 'Audit Trail Logging']
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-gray-100 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Background Decorative Glow Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]"></div>
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-purple-600/15 rounded-full blur-[160px]"></div>
        <div className="absolute -bottom-40 left-1/3 w-[36rem] h-[36rem] bg-cyan-600/15 rounded-full blur-[160px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#090D16]/85 border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 shadow-lg shadow-indigo-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                NEXORA<span className="text-indigo-400">.AI</span>
              </span>
              <span className="hidden sm:block text-[10px] tracking-widest text-indigo-400 uppercase font-semibold">
                Autonomous Workflow Platform
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#simulator" className="hover:text-indigo-400 transition-colors flex items-center gap-1 text-cyan-300">
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Simulator</span>
            </a>
            <a href="#how-to-use" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-indigo-300">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>User Guide</span>
            </a>
            <a href="#flows" className="hover:text-indigo-400 transition-colors">Visual Flows</a>
            <a href="#agents" className="hover:text-indigo-400 transition-colors">AI Agents</a>
            <a href="#architecture" className="hover:text-indigo-400 transition-colors">Architecture</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDocsModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-semibold text-indigo-300 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guide Modal</span>
            </button>

            <button
              onClick={() => navigate('/login')}
              className="px-3.5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </button>

            <button
              onClick={() => navigate('/login')}
              className="relative group px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white overflow-hidden shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 group-hover:opacity-90 transition-opacity"></div>
              <span className="relative flex items-center gap-2">
                <span>Launch Canvas</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-gray-800 bg-gray-900/80 text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden backdrop-blur-2xl bg-[#090D16]/95 border-b border-gray-800 px-4 py-6 space-y-4 animate-fade-in">
            <a
              href="#simulator"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-cyan-300 hover:text-white py-2 border-b border-gray-800/60 flex items-center gap-2"
            >
              <Play className="w-4 h-4 text-cyan-400" />
              <span>Live Workflow Simulator</span>
            </a>
            <a
              href="#how-to-use"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-indigo-300 hover:text-white py-2 border-b border-gray-800/60 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>How-To-Use Guide</span>
            </a>
            <a
              href="#flows"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-gray-300 hover:text-white py-2 border-b border-gray-800/60"
            >
              Visual Flow Diagrams
            </a>
            <a
              href="#agents"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-gray-300 hover:text-white py-2 border-b border-gray-800/60"
            >
              5-Agent AI Engine
            </a>
            <a
              href="#post-login"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-purple-300 hover:text-white py-2 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-purple-400" />
              <span>Post-Login Platform Map</span>
            </a>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-12 pb-16 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 sm:mb-8 backdrop-blur-md animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Autonomous Multi-Agent Workflow Engine v2.4</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.15]">
            Automate Any Workflow with{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Autonomous AI Agents
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-xl text-gray-400 max-w-3xl mx-auto font-normal leading-relaxed">
            Build, execute, and self-heal complex multi-step automation DAGs using natural language prompts or a visual drag-and-drop node canvas. Powered by Redis queues and 5 collaborative AI agents.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-xl shadow-indigo-600/30 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
            >
              <span>Start Building Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <a
              href="#simulator"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-cyan-300 border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
              <span>Watch Animated Simulation</span>
            </a>
          </div>

          {/* Stats Bar */}
          <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-gray-800 text-left">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">10x</div>
              <div className="text-xs text-gray-400 mt-1">Faster Automation Setup</div>
            </div>
            <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-gray-800 text-left">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400">5 AI Agents</div>
              <div className="text-xs text-gray-400 mt-1">Autonomous Collaboration</div>
            </div>
            <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-gray-800 text-left">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">99.9%</div>
              <div className="text-xs text-gray-400 mt-1">Self-Healing Uptime</div>
            </div>
            <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-gray-800 text-left">
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">&lt;50ms</div>
              <div className="text-xs text-gray-400 mt-1">Node Processing Time</div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 1: LIVE ANIMATED WORKFLOW SIMULATOR (REAL PARTICLE FLOW)          */}
        {/* ========================================================================= */}
        <section id="simulator" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="glass-panel p-5 sm:p-8 rounded-3xl border border-indigo-500/30 shadow-2xl relative overflow-hidden">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-6 mb-8">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                  Live Execution Simulator (Interactive Data Flow)
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  Watch How NEXORA AI Executes Workflows
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSimPlaying(!simPlaying)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                    simPlaying
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                  }`}
                >
                  {simPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{simPlaying ? 'Pause Flow' : 'Play Flow'}</span>
                </button>

                <button
                  onClick={handleResetSim}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart</span>
                </button>
              </div>
            </div>

            {/* Simulated Live Node Pipeline with Animated SVG Particles */}
            <div className="relative py-8 px-2">
              {/* Animated Connecting Beams */}
              <div className="hidden md:block absolute top-1/2 left-12 right-12 h-1 bg-gray-800 -translate-y-1/2 z-0 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 via-cyan-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${(simStep / 5) * 100}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                {/* Node 1: Trigger */}
                <div
                  className={`p-5 rounded-2xl border transition-all duration-500 text-left ${
                    simStep >= 1
                      ? 'bg-gray-900/90 border-indigo-500/80 shadow-lg shadow-indigo-500/20 scale-105'
                      : 'bg-gray-950/60 border-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Step 1 • Trigger
                    </span>
                    <Zap className={`w-4 h-4 ${simStep === 1 ? 'text-indigo-400 animate-bounce' : 'text-gray-500'}`} />
                  </div>
                  <h4 className="text-sm font-bold text-white">Webhook Listener</h4>
                  <p className="text-xs text-gray-400 mt-1">POST /api/v1/hooks</p>

                  <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
                    <span className="text-gray-400">Status:</span>
                    <span className={simStep >= 1 ? 'text-emerald-400 font-bold' : 'text-gray-600'}>
                      {simStep >= 1 ? '200 OK' : 'Waiting'}
                    </span>
                  </div>
                </div>

                {/* Node 2: AI Agent */}
                <div
                  className={`p-5 rounded-2xl border transition-all duration-500 text-left ${
                    simStep >= 2
                      ? 'bg-gray-900/90 border-purple-500/80 shadow-lg shadow-purple-500/20 scale-105'
                      : 'bg-gray-950/60 border-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Step 2 • AI Agent
                    </span>
                    <Bot className={`w-4 h-4 ${simStep === 2 ? 'text-purple-400 animate-pulse' : 'text-gray-500'}`} />
                  </div>
                  <h4 className="text-sm font-bold text-white">Research Agent</h4>
                  <p className="text-xs text-gray-400 mt-1">Summarize Payload</p>

                  <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
                    <span className="text-gray-400">Tokens:</span>
                    <span className={simStep >= 2 ? 'text-purple-300 font-bold' : 'text-gray-600'}>
                      {simStep >= 2 ? '340 Tokens' : 'Waiting'}
                    </span>
                  </div>
                </div>

                {/* Node 3: Logic Filter */}
                <div
                  className={`p-5 rounded-2xl border transition-all duration-500 text-left ${
                    simStep >= 3
                      ? 'bg-gray-900/90 border-cyan-500/80 shadow-lg shadow-cyan-500/20 scale-105'
                      : 'bg-gray-950/60 border-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Step 3 • Logic
                    </span>
                    <GitBranch className={`w-4 h-4 ${simStep === 3 ? 'text-cyan-400 animate-spin' : 'text-gray-500'}`} />
                  </div>
                  <h4 className="text-sm font-bold text-white">Priority Check</h4>
                  <p className="text-xs text-gray-400 mt-1">If severity == 'HIGH'</p>

                  <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
                    <span className="text-gray-400">Condition:</span>
                    <span className={simStep >= 3 ? 'text-cyan-400 font-bold' : 'text-gray-600'}>
                      {simStep >= 3 ? 'PASSED (TRUE)' : 'Waiting'}
                    </span>
                  </div>
                </div>

                {/* Node 4: Action */}
                <div
                  className={`p-5 rounded-2xl border transition-all duration-500 text-left ${
                    simStep >= 4
                      ? 'bg-gray-900/90 border-emerald-500/80 shadow-lg shadow-emerald-500/20 scale-105'
                      : 'bg-gray-950/60 border-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Step 4 • Action
                    </span>
                    <Send className={`w-4 h-4 ${simStep >= 4 ? 'text-emerald-400' : 'text-gray-500'}`} />
                  </div>
                  <h4 className="text-sm font-bold text-white">Telegram Alert</h4>
                  <p className="text-xs text-gray-400 mt-1">Dispatch to @ops</p>

                  <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
                    <span className="text-gray-400">Result:</span>
                    <span className={simStep >= 4 ? 'text-emerald-400 font-bold' : 'text-gray-600'}>
                      {simStep >= 4 ? 'Delivered' : 'Waiting'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Telemetry Log Terminal */}
            <div className="mt-6 bg-[#050811] rounded-2xl border border-gray-800/80 p-4 text-left font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between text-gray-500 pb-2 border-b border-gray-800/80 mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-gray-300 font-bold">Execution Telemetry Console</span>
                </div>
                <span className="text-[10px] text-gray-500">Live WebSockets Stream</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {simLogs.length === 0 ? (
                  <div className="text-gray-600 italic">Initializing execution telemetry stream...</div>
                ) : (
                  simLogs.map((log, idx) => (
                    <div key={idx} className="text-cyan-300/90 leading-relaxed">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: 4 VISUAL DIAGRAM FLOW CARDS                                    */}
        {/* ========================================================================= */}
        <section id="flows" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Interactive Flow Diagrams
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
              Understanding Every Feature Visually
            </h2>
            <p className="mt-3 text-gray-400 text-sm sm:text-base">
              Explore how each core system module processes data and handles errors under the hood.
            </p>
          </div>

          {/* Flow Diagram Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <button
              onClick={() => setActiveDiagramFlow('prompt')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                activeDiagramFlow === 'prompt'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/30'
                  : 'bg-gray-900/80 text-gray-400 border-gray-800 hover:text-white'
              }`}
            >
              💬 AI Prompt to Graph
            </button>

            <button
              onClick={() => setActiveDiagramFlow('healing')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                activeDiagramFlow === 'healing'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/30'
                  : 'bg-gray-900/80 text-gray-400 border-gray-800 hover:text-white'
              }`}
            >
              🛡️ Self-Healing Auto Recovery
            </button>

            <button
              onClick={() => setActiveDiagramFlow('agents')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                activeDiagramFlow === 'agents'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/30'
                  : 'bg-gray-900/80 text-gray-400 border-gray-800 hover:text-white'
              }`}
            >
              🤖 5-Agent Parallel Delegation
            </button>

            <button
              onClick={() => setActiveDiagramFlow('queue')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                activeDiagramFlow === 'queue'
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-500/30'
                  : 'bg-gray-900/80 text-gray-400 border-gray-800 hover:text-white'
              }`}
            >
              ⚡ Redis Queue Worker Daemon
            </button>
          </div>

          {/* Active Flow Visual Diagram Box */}
          <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-gray-800 text-left relative overflow-hidden">
            {activeDiagramFlow === 'prompt' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">Natural Language Prompt ➔ AST Graph Generation</h3>
                    <p className="text-xs text-gray-400">How LLM parses natural language into Directed Acyclic Graphs</p>
                  </div>
                </div>

                {/* Animated Diagram Flow */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                  <div className="bg-gray-950 p-5 rounded-2xl border border-purple-500/30">
                    <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">Input 1 • User Prompt</span>
                    <p className="text-xs font-mono text-gray-300 mt-2 bg-gray-900 p-3 rounded-lg border border-gray-800">
                      "If webhook receives 500 status code, send email to ops@domain.com."
                    </p>
                  </div>

                  <div className="bg-gray-950 p-5 rounded-2xl border border-indigo-500/30 text-center flex flex-col items-center justify-center">
                    <Bot className="w-8 h-8 text-indigo-400 animate-pulse mb-2" />
                    <span className="text-xs font-bold text-white">Workflow Agent Engine</span>
                    <span className="text-[10px] text-gray-400 mt-1">Topological AST Construction</span>
                  </div>

                  <div className="bg-gray-950 p-5 rounded-2xl border border-emerald-500/30">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Output • Rendered Nodes</span>
                    <div className="mt-2 space-y-1.5 text-xs font-mono text-emerald-300">
                      <div>✓ Node 1: Webhook Trigger</div>
                      <div>✓ Node 2: If/Else Condition</div>
                      <div>✓ Node 3: Send Email Action</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDiagramFlow === 'healing' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">Self-Healing Error Recovery Flow</h3>
                    <p className="text-xs text-gray-400">Automatic 6-category failure detection & retry policy</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
                  <div className="bg-gray-950 p-4 rounded-2xl border border-red-500/40">
                    <span className="text-[10px] font-mono text-red-400 uppercase font-bold">1. Failure Trigger</span>
                    <p className="text-xs text-gray-300 mt-1">API returns 502 Gateway Error</p>
                  </div>

                  <div className="bg-gray-950 p-4 rounded-2xl border border-yellow-500/40">
                    <span className="text-[10px] font-mono text-yellow-400 uppercase font-bold">2. Error Classification</span>
                    <p className="text-xs text-gray-300 mt-1">Categorized as TRANSIENT_ERROR</p>
                  </div>

                  <div className="bg-gray-950 p-4 rounded-2xl border border-cyan-500/40">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">3. Exponential Retry</span>
                    <p className="text-xs text-gray-300 mt-1">Backoff delay: 1000ms ➔ 2000ms</p>
                  </div>

                  <div className="bg-gray-950 p-4 rounded-2xl border border-emerald-500/40">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">4. Recovered</span>
                    <p className="text-xs text-gray-300 mt-1">Attempt #2 Succeeded (200 OK)</p>
                  </div>
                </div>
              </div>
            )}

            {activeDiagramFlow === 'agents' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">5-Agent Parallel Execution Architecture</h3>
                    <p className="text-xs text-gray-400">Autonomous task delegation and result aggregation</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 py-4 text-center">
                  <div className="bg-gray-950 p-3.5 rounded-xl border border-blue-500/30">
                    <span className="text-xs font-bold text-blue-300 block">Research</span>
                    <span className="text-[10px] text-gray-400">Web Extraction</span>
                  </div>
                  <div className="bg-gray-950 p-3.5 rounded-xl border border-purple-500/30">
                    <span className="text-xs font-bold text-purple-300 block">Data Analysis</span>
                    <span className="text-[10px] text-gray-400">JSON Parsing</span>
                  </div>
                  <div className="bg-gray-950 p-3.5 rounded-xl border border-indigo-500/30">
                    <span className="text-xs font-bold text-indigo-300 block">Workflow</span>
                    <span className="text-[10px] text-gray-400">DAG Builder</span>
                  </div>
                  <div className="bg-gray-950 p-3.5 rounded-xl border border-amber-500/30">
                    <span className="text-xs font-bold text-amber-300 block">Action</span>
                    <span className="text-[10px] text-gray-400">API Dispatcher</span>
                  </div>
                  <div className="bg-gray-950 p-3.5 rounded-xl border border-emerald-500/30">
                    <span className="text-xs font-bold text-emerald-300 block">Review</span>
                    <span className="text-[10px] text-gray-400">QA Auditor</span>
                  </div>
                </div>
              </div>
            )}

            {activeDiagramFlow === 'queue' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Server className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">Distributed Redis & BullMQ Worker Architecture</h3>
                    <p className="text-xs text-gray-400">Asynchronous non-blocking background job daemon</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                  <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800">
                    <span className="text-xs font-bold text-indigo-400">1. Express HTTP Server</span>
                    <p className="text-xs text-gray-400 mt-1">Receives POST request & enqueues job into BullMQ queue.</p>
                  </div>
                  <div className="bg-gray-950 p-4 rounded-2xl border border-cyan-500/40">
                    <span className="text-xs font-bold text-cyan-300">2. Redis Broker (Port 6379)</span>
                    <p className="text-xs text-gray-400 mt-1">Stores pending workflow jobs with in-memory fallback.</p>
                  </div>
                  <div className="bg-gray-950 p-4 rounded-2xl border border-emerald-500/40">
                    <span className="text-xs font-bold text-emerald-400">3. Worker Daemon (`worker.js`)</span>
                    <p className="text-xs text-gray-400 mt-1">Pulls jobs asynchronously & executes DAG graph topology.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: POST-LOGIN PLATFORM GUIDE (WHAT TO DO AFTER LOGIN)            */}
        {/* ========================================================================= */}
        <section id="post-login" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-purple-500/30 text-left">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                Post-Login Platform Map
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-3">
                What Happens After You Log In?
              </h2>
              <p className="mt-2 text-gray-400 text-sm sm:text-base">
                Here is exactly what your dashboard looks like and how to use every screen after signing in.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Screen 1 */}
              <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-all">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-4">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">1. Workflows Dashboard</h4>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  View all saved workflows, total execution counts, active triggers, and status tags (Draft, Active, Paused).
                </p>
              </div>

              {/* Screen 2 */}
              <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 hover:border-indigo-500/50 transition-all">
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-4">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">2. Visual Canvas Builder</h4>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Drag triggers & actions from left sidebar onto React Flow canvas. Click nodes to open configuration panels.
                </p>
              </div>

              {/* Screen 3 */}
              <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 hover:border-cyan-500/50 transition-all">
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit mb-4">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">3. Credentials & Vault</h4>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Store Telegram Bot Tokens, Slack Webhooks, and API Keys securely. AES-256 automatically encrypts secret keys.
                </p>
              </div>

              {/* Screen 4 */}
              <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 hover:border-emerald-500/50 transition-all">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-4">
                  <Activity className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">4. Execution Telemetry</h4>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Inspect live logs, step-by-step payloads, execution latencies, and self-healing recovery reports.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: COLORFUL STEP-BY-STEP USER GUIDE */}
        <section id="how-to-use" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-bold uppercase tracking-widest border border-cyan-500/20 mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Complete How-To-Use Documentation</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              How NEXORA AI Works: <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Step-by-Step Flow</span>
            </h2>
            <p className="mt-4 text-gray-400 text-base sm:text-lg">
              Follow this visual 5-step roadmap to build, configure, and automate your workflows effortlessly.
            </p>
          </div>

          {/* Interactive Step Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10 max-w-5xl mx-auto">
            {steps.map((step) => {
              const Icon = step.icon;
              const isSelected = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between ${
                    isSelected
                      ? `bg-gray-900 border-indigo-500 shadow-xl shadow-indigo-500/20 scale-105`
                      : `glass-card border-gray-800 opacity-70 hover:opacity-100 hover:border-gray-700`
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${step.badgeColor}`}>
                      STEP {step.stepNumber}
                    </span>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-gray-400'}`} />
                  </div>
                  <div className="text-xs font-bold text-white line-clamp-1">{step.title}</div>
                </button>
              );
            })}
          </div>

          {/* Active Step Detailed Interactive Card */}
          {steps.map((step) => {
            if (step.id !== activeStep) return null;
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className="glass-panel p-6 sm:p-10 rounded-3xl border border-gray-800 relative overflow-hidden transition-all duration-500"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left Explanation Column */}
                  <div className="lg:col-span-7 text-left">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-lg`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <span className={`text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${step.badgeColor}`}>
                          Phase {step.stepNumber} Guide
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                          {step.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-gray-300 text-base leading-relaxed mb-6">
                      {step.description}
                    </p>

                    <div className="space-y-3 border-t border-gray-800/80 pt-5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Key Execution Notes:</h4>
                      {step.details.map((detail, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm text-gray-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Interactive Code / Visual Snippet Column */}
                  <div className="lg:col-span-5">
                    <div className="bg-[#050811] rounded-2xl border border-gray-800 p-5 shadow-2xl relative">
                      <div className="flex items-center justify-between border-b border-gray-800/80 pb-3 mb-4 text-xs text-gray-400 font-mono">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-indigo-400" />
                          <span>step_{step.stepNumber}_payload.json</span>
                        </div>
                        <button
                          onClick={() => handleCopy(step.codeSnippet)}
                          className="hover:text-white transition-colors flex items-center gap-1"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <pre className="text-xs font-mono text-cyan-300 overflow-x-auto p-2 leading-relaxed selection:bg-indigo-900">
                        <code>{step.codeSnippet}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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
            <div className="glass-card p-8 rounded-2xl border border-gray-800 hover:border-indigo-500/40 relative group">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-5 group-hover:scale-110 transition-transform">
                <Workflow className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Visual Drag & Drop Canvas</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Construct Directed Acyclic Graphs (DAGs) seamlessly with `@xyflow/react`. Link triggers, conditions, and action nodes with topological evaluation.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-gray-800 hover:border-purple-500/40 relative group">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-5 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">5-Agent AI Orchestrator</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Delegates complex prompts across 5 specialized autonomous agents (Research, Analysis, Workflow, Action, and Review) for high accuracy execution.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-gray-800 hover:border-emerald-500/40 relative group">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-5 group-hover:scale-110 transition-transform">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Self-Healing Recovery</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Categorizes API failures into 6 error types. Performs automatic exponential backoff retries and triggers Human-in-the-Loop escalations when needed.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-gray-800 hover:border-cyan-500/40 relative group">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit mb-5 group-hover:scale-110 transition-transform">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Distributed Queue Engine</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Powered by a standalone Node.js worker daemon listening to BullMQ & Redis queues. Executes heavy background jobs asynchronously with zero blocking.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-gray-800 hover:border-amber-500/40 relative group">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 w-fit mb-5 group-hover:scale-110 transition-transform">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Universal Integrations</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Connect Telegram, Slack, Webhooks, Google Sheets, Gmail, and custom HTTP REST APIs with encrypted headers and parameter injection.
              </p>
            </div>

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

        {/* AI AGENTS SHOWCASE */}
        <section id="agents" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="glass-panel p-6 sm:p-12 rounded-3xl border border-gray-800">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">Multi-Agent System</h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">5 Autonomous Agents Working in Harmony</p>
            </div>

            {/* Agent Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
              {Object.keys(agentDetails).map((key) => {
                const agent = agentDetails[key];
                const isActive = activeAgentTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveAgentTab(key)}
                    className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
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
        <section id="architecture" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">System Architecture</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">Built with Industry-Leading Tech Stack</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="glass-card p-4 sm:p-5 rounded-2xl border border-gray-800 text-center">
              <Code2 className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-xs sm:text-sm font-bold text-white">React 18 & Vite</div>
              <div className="text-[10px] sm:text-[11px] text-gray-400 mt-1">Single Page SPA</div>
            </div>

            <div className="glass-card p-4 sm:p-5 rounded-2xl border border-gray-800 text-center">
              <Terminal className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-xs sm:text-sm font-bold text-white">Node.js 22</div>
              <div className="text-[10px] sm:text-[11px] text-gray-400 mt-1">Express API Engine</div>
            </div>

            <div className="glass-card p-4 sm:p-5 rounded-2xl border border-gray-800 text-center">
              <Database className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-xs sm:text-sm font-bold text-white">MySQL 8.0</div>
              <div className="text-[10px] sm:text-[11px] text-gray-400 mt-1">Relational Database</div>
            </div>

            <div className="glass-card p-4 sm:p-5 rounded-2xl border border-gray-800 text-center">
              <Activity className="w-7 h-7 sm:w-8 sm:h-8 text-red-400 mx-auto mb-2" />
              <div className="text-xs sm:text-sm font-bold text-white">Redis 7 & BullMQ</div>
              <div className="text-[10px] sm:text-[11px] text-gray-400 mt-1">Distributed Queue</div>
            </div>

            <div className="glass-card p-4 sm:p-5 rounded-2xl border border-gray-800 text-center">
              <Workflow className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-xs sm:text-sm font-bold text-white">React Flow v12</div>
              <div className="text-[10px] sm:text-[11px] text-gray-400 mt-1">DAG Visual Nodes</div>
            </div>

            <div className="glass-card p-4 sm:p-5 rounded-2xl border border-gray-800 text-center">
              <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 mx-auto mb-2" />
              <div className="text-xs sm:text-sm font-bold text-white">AES-256-GCM</div>
              <div className="text-[10px] sm:text-[11px] text-gray-400 mt-1">Credential Security</div>
            </div>
          </div>
        </section>

        {/* CTA CALLOUT FOOTER */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden p-8 sm:p-16 text-center border border-indigo-500/30 bg-gradient-to-br from-indigo-950/80 via-purple-950/40 to-gray-950">
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-5xl font-black text-white tracking-tight">
                Ready to Experience Next-Gen Automation?
              </h2>
              <p className="mt-4 text-gray-300 text-sm sm:text-lg">
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

      {/* INTERACTIVE DOCUMENTATION MODAL POPUP */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0D1322] border border-gray-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative text-left">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">NEXORA AI — Official User Guide & Manual</h3>
                  <p className="text-xs text-gray-400">Complete walkthrough for building and executing workflows</p>
                </div>
              </div>
              <button
                onClick={() => setShowDocsModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <h4 className="font-bold text-white text-base mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Quick Overview
                </h4>
                <p className="text-xs text-gray-300">
                  NEXORA AI allows you to construct automated workflows by chaining Trigger, Condition, and Action nodes. You can either build them visually on the React Flow canvas or describe them in natural language for AI to generate.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white text-base mb-3 flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-indigo-400" />
                  How to Build Your First Workflow
                </h4>
                <ol className="list-decimal list-inside space-y-2.5 text-xs text-gray-300">
                  <li><strong className="text-white">Sign In:</strong> Register your account and navigate to the Workflows Dashboard.</li>
                  <li><strong className="text-white">Create Workflow:</strong> Click "Create Workflow" or open an existing draft.</li>
                  <li><strong className="text-white">Select Trigger Node:</strong> Add a <em>Manual Trigger</em>, <em>Webhook Listener</em>, or <em>Schedule Timer</em>.</li>
                  <li><strong className="text-white">Add Actions:</strong> Drag action nodes such as <em>HTTP Request</em>, <em>Telegram Bot</em>, or <em>Slack Message</em> onto the canvas.</li>
                  <li><strong className="text-white">Connect Edges:</strong> Drag lines between output handles and input handles to define execution order.</li>
                  <li><strong className="text-white">Run & Test:</strong> Click the "Run Workflow" button to watch node-by-node execution telemetry!</li>
                </ol>
              </div>

              <div className="border-t border-gray-800 pt-5">
                <h4 className="font-bold text-white text-base mb-3 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-400" />
                  Using the AI Prompt Generator
                </h4>
                <p className="text-xs text-gray-300 mb-3">
                  Click the **"AI Generator"** button inside the builder canvas and type any prompt:
                </p>
                <div className="p-3 rounded-lg bg-gray-950 font-mono text-xs text-cyan-300 border border-gray-800">
                  "Create a workflow that checks website status every 10 minutes, and if HTTP status is 500, send Telegram alert to channel @my_ops_alerts."
                </div>
              </div>

              <div className="border-t border-gray-800 pt-5 flex items-center justify-between">
                <span className="text-xs text-gray-400">Need more help? Check the README documentation in GitHub repo.</span>
                <button
                  onClick={() => {
                    setShowDocsModal(false);
                    navigate('/login');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold text-xs hover:scale-105 transition-all"
                >
                  Start Building Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800/80 py-8 px-4 text-center text-xs text-gray-500 relative z-10">
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
