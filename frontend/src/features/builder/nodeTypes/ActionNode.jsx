import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { getNodeMetadata } from './nodeRegistry';

export const ActionNode = memo(({ data, selected }) => {
  const meta = getNodeMetadata('action', data.subtype || 'http_request');

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-xl bg-slate-900 border-2 transition-all ${
        selected ? 'border-emerald-400 ring-2 ring-emerald-500/50 shadow-emerald-500/20' : 'border-emerald-600/50'
      }`}
      style={{ minWidth: 200 }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-emerald-400 border-2 border-slate-900 hover:scale-125 transition-transform"
      />
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-bold">{meta.icon}</span>
        <div>
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Action</div>
          <div className="text-sm font-bold text-white leading-tight">{data.label || meta.label}</div>
        </div>
      </div>
      <div className="text-xs text-slate-400 font-mono bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80 mt-2 truncate">
        {data.subtype || 'http_request'}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-emerald-400 border-2 border-slate-900 hover:scale-125 transition-transform"
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';
