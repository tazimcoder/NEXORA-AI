import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';

export const NodeConfigPanel = () => {
  const selectedNode = useWorkflowStore((state) => state.selectedNode);
  const selectNode = useWorkflowStore((state) => state.selectNode);
  const updateNodeConfig = useWorkflowStore((state) => state.updateNodeConfig);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode);

  const [label, setLabel] = useState('');
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label || '');
      setConfig(selectedNode.data.config || {});
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const handleLabelChange = (e) => {
    const val = e.target.value;
    setLabel(val);
    updateNodeConfig(selectedNode.id, { label: val });
  };

  const handleConfigChange = (key, val) => {
    const newConfig = { ...config, [key]: val };
    setConfig(newConfig);
    updateNodeConfig(selectedNode.id, { config: newConfig });
  };

  return (
    <div className="absolute top-20 right-4 z-20 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 text-white">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">{selectedNode.type}</span>
          <h3 className="font-bold text-base text-white">{selectedNode.data.subtype}</h3>
        </div>
        <button onClick={() => selectNode(null)} className="text-slate-400 hover:text-white font-bold text-lg">
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Node Title</label>
          <input
            type="text"
            value={label}
            onChange={handleLabelChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Condition-specific parameters */}
        {selectedNode.type === 'condition' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Operator</label>
              <select
                value={config.operator || 'equals'}
                onChange={(e) => handleConfigChange('operator', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="equals">equals</option>
                <option value="not equals">not equals</option>
                <option value="greater than">greater than</option>
                <option value="less than">less than</option>
                <option value="greater than or equal">greater than or equal</option>
                <option value="less than or equal">less than or equal</option>
                <option value="contains">contains</option>
                <option value="exists">exists</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Left Operand Path</label>
              <input
                type="text"
                value={config.leftValue || ''}
                onChange={(e) => handleConfigChange('leftValue', e.target.value)}
                placeholder="e.g. input.body.status"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Right Operand Value</label>
              <input
                type="text"
                value={config.rightValue || ''}
                onChange={(e) => handleConfigChange('rightValue', e.target.value)}
                placeholder="e.g. completed"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </>
        )}

        {/* HTTP Action parameters */}
        {selectedNode.data.subtype === 'http_request' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Target URL</label>
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => handleConfigChange('url', e.target.value)}
                placeholder="https://api.example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">HTTP Method</label>
              <select
                value={config.method || 'POST'}
                onChange={(e) => handleConfigChange('method', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </>
        )}

        {/* Notification Action parameters */}
        {selectedNode.data.subtype === 'create_notification' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Alert Title</label>
              <input
                type="text"
                value={config.title || ''}
                onChange={(e) => handleConfigChange('title', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Message</label>
              <textarea
                value={config.message || ''}
                onChange={(e) => handleConfigChange('message', e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </>
        )}
      </div>

      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={() => duplicateNode(selectedNode.id)}
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 rounded-xl transition-all"
        >
          📋 Duplicate
        </button>
        <button
          onClick={() => deleteNode(selectedNode.id)}
          className="flex-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold py-2 rounded-xl transition-all border border-rose-500/30"
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
};
