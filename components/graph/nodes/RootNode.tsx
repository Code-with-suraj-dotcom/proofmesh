import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Sparkles } from 'lucide-react';
import { EvidenceNodeData } from '@/types/graph';

export function RootNode({ data }: { data: EvidenceNodeData }) {
  return (
    <div className="min-w-[280px] max-w-[340px] rounded-xl bg-gradient-to-b from-[#151C2B] to-[#101522] border-2 border-[#3678F6] p-4 shadow-xl shadow-[#3678F6]/10 text-left">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-5 h-5 rounded bg-[#3678F6]/20 text-[#3678F6] flex items-center justify-center">
          <Sparkles className="w-3 h-3" />
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#3678F6] font-semibold">
          Primary Research Question
        </span>
      </div>
      <p className="text-sm font-medium text-[#F5F7FB] line-clamp-3 leading-snug">
        {data.label}
      </p>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#3678F6] !w-2.5 !h-2.5"
      />
    </div>
  );
}

