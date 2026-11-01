import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Flame, AlertOctagon } from 'lucide-react';
import { EvidenceNodeData } from '@/types/graph';

export function ContradictionNode({ data }: { data: EvidenceNodeData }) {
  const isCritical = data.severity === 'critical' || data.severity === 'high';

  return (
    <div
      className={`min-w-[220px] max-w-[260px] rounded-lg bg-gradient-to-br from-[#1c1216] to-[#151C2B] border ${
        isCritical ? 'border-[#EF4444]' : 'border-amber-500/80'
      } p-3 shadow-lg shadow-[#EF4444]/10 transition-all text-left cursor-pointer`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#EF4444] !w-2 !h-2"
      />

      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5 text-[#EF4444]">
          <Flame className="w-3.5 h-3.5 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
            Contradiction
          </span>
        </div>
        {data.severity && (
          <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30">
            {data.severity}
          </span>
        )}
      </div>

      <p className="text-xs font-medium text-[#F5F7FB] line-clamp-3 leading-snug">
        {data.explanation || data.label}
      </p>

      {data.contradictionType && (
        <span className="text-[9px] text-[#8994A8] font-mono mt-2 block border-t border-white/[0.06] pt-1">
          Type: {data.contradictionType.replace('_', ' ')}
        </span>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#EF4444] !w-2 !h-2"
      />
    </div>
  );
}

