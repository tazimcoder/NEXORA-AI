export const NODE_TYPES_REGISTRY = [
  // Triggers
  {
    type: 'trigger',
    subtype: 'webhook',
    label: 'Webhook Trigger',
    category: 'Triggers',
    color: '#0284c7', // Sky blue
    icon: '⚡',
    defaultConfig: { path: '/webhook/catch', method: 'POST' },
  },
  {
    type: 'trigger',
    subtype: 'manual',
    label: 'Manual Trigger',
    category: 'Triggers',
    color: '#2563eb', // Blue
    icon: '▶',
    defaultConfig: {},
  },
  {
    type: 'trigger',
    subtype: 'schedule',
    label: 'Cron Schedule',
    category: 'Triggers',
    color: '#4f46e5', // Indigo
    icon: '⏰',
    defaultConfig: { cron: '0 * * * *', timezone: 'UTC' },
  },

  // Conditions & Logic
  {
    type: 'condition',
    subtype: 'if_else',
    label: 'If / Else Condition',
    category: 'Logic & Conditions',
    color: '#d97706', // Amber
    icon: '🔀',
    defaultConfig: { operator: 'equals', leftValue: 'input.body.status', rightValue: 'completed' },
  },

  // Actions
  {
    type: 'action',
    subtype: 'http_request',
    label: 'HTTP Request',
    category: 'Actions',
    color: '#059669', // Emerald
    icon: '🌐',
    defaultConfig: { url: 'https://api.example.com', method: 'POST', timeout_ms: 10000 },
  },
  {
    type: 'action',
    subtype: 'create_notification',
    label: 'Create Notification',
    category: 'Actions',
    color: '#0d9488', // Teal
    icon: '🔔',
    defaultConfig: { title: 'Workflow Alert', message: 'Action executed successfully', type: 'system' },
  },
  {
    type: 'action',
    subtype: 'delay',
    label: 'Delay / Wait',
    category: 'Actions',
    color: '#7c3aed', // Purple
    icon: '⏳',
    defaultConfig: { duration_ms: 1000 },
  },
  {
    type: 'action',
    subtype: 'internal_system',
    label: 'System Checkpoint',
    category: 'Actions',
    color: '#4b5563', // Gray
    icon: '⚙',
    defaultConfig: { task: 'system_checkpoint' },
  },
];

export const getNodeMetadata = (type, subtype) => {
  return NODE_TYPES_REGISTRY.find((n) => n.type === type && n.subtype === subtype) || {
    type,
    subtype,
    label: `${type} (${subtype})`,
    category: 'Custom',
    color: '#6b7280',
    icon: '📦',
    defaultConfig: {},
  };
};
