import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Target, ShieldCheck } from 'lucide-react';
import { EvidenceNodeData } from '@/types/graph';

export function ObjectiveNode({ data }: { data: EvidenceNodeData }) {
  const specColors: Record<string, string> = {
    economic: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    technical: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
    regulatory: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
    academic: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    industry: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    environmental: 'text-teal-400 bg-teal-400/10 border-teal-400/30',
    counterargument: 'text-red-400 bg-red-400/10 border-red-400/30',
    verification: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
  };

  const badgeColor =
    (data.specialization && specColors[data.specialization]) ||
    'text-[#3678F6] bg-[#3678F6]/10 border-[#3678F6]/30';

  return (
    <div className="min-w-[240px] max-w-[280px] rounded-lg bg-[#151C2B] border border-white/[0.12] hover:border-[#3678F6]/60 p-3 shadow-lg transition-all text-left group">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#3678F6] !w-2 !h-2"
      />

      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-[#3678F6]" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8994A8]">
            Objective
          </span>
        </div>
        {data.specialization && (
          <span
            className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border ${badgeColor}`}
          >
            {data.specialization}
          </span>
        )}
      </div>

      <h4 className="text-xs font-semibold text-[#F5F7FB] line-clamp-2 leading-tight mb-1">
        {data.title || data.label}
      </h4>

      {data.explanation && (
        <p className="text-[11px] text-[#8994A8] line-clamp-2 leading-relaxed">
          {data.explanation}
        </p>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#3678F6] !w-2 !h-2"
      />
    </div>
  );
}

