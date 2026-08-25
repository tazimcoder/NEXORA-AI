import React, { useState } from 'react';
import { NODE_TYPES_REGISTRY } from './nodeTypes/nodeRegistry';
import { useWorkflowStore } from '../../store/workflowStore';

export const AddNodeMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const addNode = useWorkflowStore((state) => state.addNode);

  const categories = Array.from(new Set(NODE_TYPES_REGISTRY.map((n) => n.category)));

  const handleAdd = (item) => {
    addNode(item.type, item.subtype);
    setIsOpen(false);
  };

  return (
    <div className="absolute top-4 left-4 z-20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-sky-500/25 transition-all active:scale-95"
      >
        <span className="text-lg">✚</span> Add Node
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-4 max-h-[75vh] overflow-y-auto space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Node Palette</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg">
              ✕
            </button>
          </div>

          {categories.map((cat) => {
            const items = NODE_TYPES_REGISTRY.filter((n) => n.category === cat);
            return (
              <div key={cat} className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">{cat}</div>
                <div className="grid grid-cols-1 gap-2">
                  {items.map((item) => (
                    <button
                      key={`${item.type}-${item.subtype}`}
                      onClick={() => handleAdd(item)}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-sky-500/50 hover:bg-slate-800/50 transition-all text-left group"
                    >
                      <span className="p-2 rounded-lg bg-slate-800 text-lg group-hover:scale-110 transition-transform">
                        {item.icon}
                      </span>
                      <div className="overflow-hidden">
                        <div className="text-sm font-semibold text-white group-hover:text-sky-400 transition-colors">
                          {item.label}
                        </div>
                        <div className="text-xs text-slate-400 font-mono truncate">{item.subtype}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
