import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { getNodeMetadata } from './nodeRegistry';

export const ConditionNode = memo(({ data, selected }) => {
  const meta = getNodeMetadata('condition', data.subtype || 'if_else');
  const operator = data.config?.operator || 'equals';

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-xl bg-slate-900 border-2 transition-all ${
        selected ? 'border-amber-400 ring-2 ring-amber-500/50 shadow-amber-500/20' : 'border-amber-600/50'
      }`}
      style={{ minWidth: 220 }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-amber-400 border-2 border-slate-900 hover:scale-125 transition-transform"
      />
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-bold">{meta.icon}</span>
        <div>
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Condition</div>
          <div className="text-sm font-bold text-white leading-tight">{data.label || meta.label}</div>
        </div>
      </div>

      <div className="text-xs text-amber-200/80 bg-slate-950/60 px-2 py-1.5 rounded border border-slate-800/80 mt-2 font-mono flex items-center justify-between">
        <span>Operator:</span>
        <span className="text-amber-400 font-bold">{operator}</span>
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <span className="text-emerald-400">✔ True</span>
        <span className="text-rose-400">✖ False</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '25%' }}
        className="w-3 h-3 bg-emerald-400 border-2 border-slate-900 hover:scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '75%' }}
        className="w-3 h-3 bg-rose-400 border-2 border-slate-900 hover:scale-125 transition-transform"
      />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
