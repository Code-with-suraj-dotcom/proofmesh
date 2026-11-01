import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Globe, ExternalLink } from 'lucide-react';
import { EvidenceNodeData } from '@/types/graph';

export function SourceNode({ data }: { data: EvidenceNodeData }) {
  return (
    <div className="min-w-[200px] max-w-[250px] rounded-lg bg-[#101522] border border-white/[0.1] hover:border-white/[0.3] p-2.5 shadow-md transition-all text-left">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#8994A8] !w-2 !h-2"
      />

      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5 text-[10px] text-[#8994A8] font-mono">
          <Globe className="w-3 h-3 text-[#8994A8]" />
          <span>{data.sourceDomain || 'Web Source'}</span>
        </div>
        {data.sourceUrl && (
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[#3678F6] hover:text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <p className="text-[11px] font-medium text-[#F5F7FB] line-clamp-2 leading-tight">
        {data.title || data.label}
      </p>

      {data.publicationDate && (
        <span className="text-[9px] text-[#5A6478] font-mono mt-1 block">
          Published: {data.publicationDate}
        </span>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#8994A8] !w-2 !h-2"
      />
    </div>
  );
}

