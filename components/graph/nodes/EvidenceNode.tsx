import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, AlertTriangle, HelpCircle, FileText } from 'lucide-react';
import { EvidenceNodeData } from '@/types/graph';

export function EvidenceNode({ data }: { data: EvidenceNodeData }) {
  const isContradiction = data.stance === 'contradicts';
  const isNeutral = data.stance === 'neutral';

  const borderColor = isContradiction
    ? 'border-[#EF4444]/60 hover:border-[#EF4444]'
    : isNeutral
    ? 'border-amber-500/50 hover:border-amber-400'
    : 'border-[#20B77A]/60 hover:border-[#20B77A]';

  const stanceBadge = isContradiction
    ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
    : isNeutral
    ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
    : 'bg-[#20B77A]/10 text-[#20B77A] border-[#20B77A]/20';

  const confidencePct = Math.round((data.confidence || 0.85) * 100);

  return (
    <div
      className={`min-w-[220px] max-w-[270px] rounded-lg bg-[#151C2B] border ${borderColor} p-3 shadow-md hover:shadow-xl transition-all cursor-pointer text-left`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#20B77A] !w-2 !h-2"
      />

      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          {isContradiction ? (
            <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
          ) : isNeutral ? (
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#20B77A]" />
          )}
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8994A8]">
            Evidence
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border ${stanceBadge}`}>
            {data.stance || 'supports'}
          </span>
          <span className="text-[9px] font-mono text-[#8994A8] bg-white/[0.05] px-1 py-0.5 rounded">
            {confidencePct}%
          </span>
        </div>
      </div>

      <p className="text-xs font-normal text-[#F5F7FB] line-clamp-3 leading-snug mb-2">
        &ldquo;{data.claimText || data.label}&rdquo;
      </p>

      {data.sourceTitle && (
        <div className="flex items-center gap-1 text-[10px] text-[#8994A8] border-t border-white/[0.06] pt-1.5 truncate">
          <FileText className="w-3 h-3 flex-shrink-0 text-[#3678F6]" />
          <span className="truncate">{data.sourceTitle}</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#20B77A] !w-2 !h-2"
      />
    </div>
  );
}

