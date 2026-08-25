import React, { useState, useEffect } from 'react';

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState({
    totalUsers: 4,
    activeWorkflows: 3,
    totalWorkflows: 5,
    runningExecutions: 0,
    successfulExecutions: 28,
    failedExecutions: 1,
    totalExecutions: 29,
    queueHealth: { status: 'healthy', waitingJobs: 0, activeJobs: 0, completedJobs: 28, failedJobs: 0 },
    workerHealth: { status: 'online', activeWorkers: 1, concurrency: 5, uptimeSeconds: 1420 },
  });

  const [users, setUsers] = useState([
    { id: 'usr_1', name: 'Admin User', email: 'admin@nexora.ai', role: 'admin', status: 'active', created_at: '2026-08-22 10:00:00' },
    { id: 'usr_2', name: 'Workflow Specialist', email: 'architect@nexora.ai', role: 'user', status: 'active', created_at: '2026-08-22 11:30:00' },
    { id: 'usr_3', name: 'Integration Engineer', email: 'dev@nexora.ai', role: 'user', status: 'active', created_at: '2026-08-22 13:15:00' },
  ]);

  const [workflows, setWorkflows] = useState([
    { id: 'wf_1', name: 'E2E Customer Onboarding Pipeline', status: 'published', current_version: 2, is_active: true, creator_email: 'admin@nexora.ai' },
    { id: 'wf_2', name: 'Webhook Event Order Sync', status: 'published', current_version: 1, is_active: true, creator_email: 'architect@nexora.ai' },
    { id: 'wf_3', name: 'Daily Slack Analytics Alert', status: 'draft', current_version: 1, is_active: false, creator_email: 'dev@nexora.ai' },
  ]);

  const toggleUserStatus = (userId) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
  };

  const toggleUserRole = (userId) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u));
  };

  return (
    <div style={{ padding: '32px', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>NEXORA AI — System Admin Panel</h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Centralized system monitoring, user RBAC controls, and queue diagnostics</p>
        </div>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', color: '#38bdf8' }}>
          🔒 Role: <strong style={{ color: '#f8fafc' }}>ADMINISTRATOR</strong>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '28px' }}>
        {[
          { key: 'overview', label: '📊 System Overview' },
          { key: 'users', label: '👥 User Management' },
          { key: 'workflows', label: '⚡ Workflows & Executions' },
          { key: 'queue', label: '🚀 Queue & Worker Health' },
          { key: 'logs', label: '🛡️ Audit & System Logs' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              backgroundColor: activeTab === tab.key ? '#2563eb' : '#1e293b',
              color: activeTab === tab.key ? '#ffffff' : '#94a3b8',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 18px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {/* Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <MetricCard title="Total Users" value={dashboard.totalUsers} icon="👥" color="#38bdf8" />
            <MetricCard title="Active Workflows" value={dashboard.activeWorkflows} icon="⚡" color="#4ade80" />
            <MetricCard title="Running Executions" value={dashboard.runningExecutions} icon="🔄" color="#facc15" />
            <MetricCard title="Successful Executions" value={dashboard.successfulExecutions} icon="✅" color="#4ade80" />
            <MetricCard title="Failed Executions" value={dashboard.failedExecutions} icon="⚠️" color="#f87171" />
            <MetricCard title="Queue Health" value={dashboard.queueHealth.status.toUpperCase()} icon="📦" color="#38bdf8" />
            <MetricCard title="Worker Status" value={dashboard.workerHealth.status.toUpperCase()} icon="⚙️" color="#4ade80" />
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Registered System Users</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#f8fafc' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Name</th>
                <th style={{ padding: '12px' }}>Email</th>
                <th style={{ padding: '12px' }}>Role</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{u.name}</td>
                  <td style={{ padding: '12px', color: '#94a3b8' }}>{u.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: u.role === 'admin' ? '#7c3aed' : '#334155', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ color: u.status === 'active' ? '#4ade80' : '#f87171', fontWeight: '600' }}>
                      ● {u.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => toggleUserStatus(u.id)} style={{ backgroundColor: u.status === 'active' ? '#ef4444' : '#22c55e', border: 'none', borderRadius: '4px', color: '#fff', padding: '6px 12px', cursor: 'pointer' }}>
                      {u.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => toggleUserRole(u.id)} style={{ backgroundColor: '#3b82f6', border: 'none', borderRadius: '4px', color: '#fff', padding: '6px 12px', cursor: 'pointer' }}>
                      {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'workflows' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Workflows & Version Overview</h2>
          {workflows.map(wf => (
            <div key={wf.id} style={{ borderBottom: '1px solid #334155', padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc' }}>{wf.name}</h3>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Creator: {wf.creator_email} | Version v{wf.current_version}</span>
              </div>
              <span style={{ backgroundColor: wf.status === 'published' ? '#065f46' : '#334155', color: wf.status === 'published' ? '#34d399' : '#94a3b8', padding: '6px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: '600' }}>
                {wf.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'queue' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#38bdf8' }}>🚀 BullMQ Queue Metrics</h3>
            <p>Waiting Jobs: <strong>0</strong></p>
            <p>Active Processing Jobs: <strong>0</strong></p>
            <p>Completed Jobs: <strong>{dashboard.queueHealth.completedJobs}</strong></p>
            <p>Failed Jobs: <strong>0</strong></p>
          </div>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#4ade80' }}>⚙️ Worker Instance Health</h3>
            <p>Status: <strong style={{ color: '#4ade80' }}>ONLINE</strong></p>
            <p>Active Worker Threads: <strong>1</strong></p>
            <p>Queue Name: <strong>workflow-execution</strong></p>
            <p>Uptime: <strong>{dashboard.workerHealth.uptimeSeconds} seconds</strong></p>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>System Audit Logs & Recovery Events</h2>
          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#34d399' }}>
            <div>[2026-08-22 15:10:00] [AUDIT] User admin@nexora.ai created workflow [E2E Customer Onboarding Pipeline]</div>
            <div>[2026-08-22 15:10:15] [RECOVERY] Node [act_http] classified as TRANSIENT_ERROR &rarr; Applied ExponentialRetryStrategy</div>
            <div>[2026-08-22 15:11:02] [AUDIT] Multi-Agent Orchestration task completed successfully (Quality Score: 0.98)</div>

          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon, color }) {
  return (
    <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>{title}</span>
        <h3 style={{ margin: '6px 0 0 0', fontSize: '24px', fontWeight: '700', color: color }}>{value}</h3>
      </div>
      <span style={{ fontSize: '28px' }}>{icon}</span>
    </div>
  );
}
