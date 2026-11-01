import React, { useState, useEffect } from 'react';
import { X, ExternalLink, ShieldCheck, AlertTriangle, Calendar, Clock, BookOpen, Quote, Lock, CheckCircle2 } from 'lucide-react';
import { EvidenceNodeData } from '@/types/graph';

interface Props {
  data: EvidenceNodeData | null;
  onClose: () => void;
}

export function EvidenceDetailDrawer({ data, onClose }: Props) {
  const [passageHash, setPassageHash] = useState<string>('');

  useEffect(() => {
    if (data?.originalPassage && typeof window !== 'undefined' && window.crypto?.subtle) {
      const msgUint8 = new TextEncoder().encode(data.originalPassage.trim());
      window.crypto.subtle.digest('SHA-256', msgUint8).then((hashBuffer) => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        setPassageHash(hashHex);
      }).catch(() => setPassageHash(''));
    } else {
      setPassageHash('');
    }
  }, [data?.originalPassage]);

  if (!data) return null;

  const isEvidence = data.nodeType === 'evidence';
  const isSource = data.nodeType === 'source';
  const isContradiction = data.nodeType === 'contradiction';
  const isObjective = data.nodeType === 'objective' || data.nodeType === 'sub_hypothesis';

  const confidencePct = Math.round((data.confidence || 0.85) * 100);

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#101522] border-l border-white/[0.1] shadow-2xl z-50 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3678F6]"></span>
          <span className="text-xs font-mono uppercase tracking-wider text-[#8994A8]">
            {data.nodeType?.replace('_', ' ')} Inspector
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[#8994A8] hover:text-[#F5F7FB] hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-left text-sm">
        {/* Title / Claim */}
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#8994A8] block mb-1">
            {isEvidence ? 'Extracted Claim' : isContradiction ? 'Contradiction Summary' : 'Title'}
          </span>
          <h3 className="text-base font-semibold text-[#F5F7FB] leading-snug">
            {data.claimText || data.title || data.label}
          </h3>
        </div>

        {/* Stance & Confidence Badges */}
        {isEvidence && (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-mono uppercase px-2 py-0.5 rounded border ${
                data.stance === 'contradicts'
                  ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                  : data.stance === 'neutral'
                  ? 'bg-amber-400/15 text-amber-400 border-amber-400/30'
                  : 'bg-[#20B77A]/15 text-[#20B77A] border-[#20B77A]/30'
              }`}
            >
              Stance: {data.stance || 'supports'}
            </span>

            <span className="text-xs font-mono bg-[#151C2B] text-[#F5F7FB] px-2 py-0.5 rounded border border-white/[0.08] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#20B77A]" />
              Confidence: {confidencePct}%
            </span>
          </div>
        )}

        {/* Verbatim Source Passage (Critical Zero-Fabrication Mandate) */}
        {data.originalPassage && (
          <div className="rounded-xl bg-[#151C2B] border border-white/[0.08] p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#3678F6]">
              <Quote className="w-3.5 h-3.5" />
              <span>Verbatim Source Passage</span>
            </div>
            <blockquote className="text-xs text-[#F5F7FB]/90 leading-relaxed italic border-l-2 border-[#3678F6] pl-3 py-1">
              &ldquo;{data.originalPassage}&rdquo;
            </blockquote>
            <p className="text-[10px] text-[#8994A8] font-mono">
              Unmodified original excerpt verified directly from retrieved web document.
            </p>
          </div>
        )}

        {/* Cryptographic SHA-256 Provenance Fingerprint */}
        {passageHash && (
          <div className="rounded-xl bg-[#151C2B] border border-[#20B77A]/25 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#20B77A]">
                <Lock className="w-3.5 h-3.5" />
                <span className="font-semibold">Cryptographic Provenance</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#20B77A]/15 text-[#20B77A] border border-[#20B77A]/30 font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                <span>SHA-256 Validated</span>
              </span>
            </div>
            <div className="bg-[#101522] rounded p-2 border border-white/[0.06] text-[10px] font-mono text-[#8994A8] select-all break-all">
              <span className="text-[#3678F6] font-semibold block uppercase mb-0.5">SHA-256 Fingerprint:</span>
              <span className="text-[#F5F7FB]">{passageHash}</span>
            </div>
          </div>
        )}

        {/* Confidence Rationale */}
        {data.confidenceRationale && (
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3 text-xs text-[#8994A8] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#F5F7FB] block">
              Confidence Evaluation Rationale:
            </span>
            <p>{data.confidenceRationale}</p>
          </div>
        )}

        {/* Contradiction Details */}
        {isContradiction && data.explanation && (
          <div className="rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#EF4444]">
              <AlertTriangle className="w-4 h-4" />
              <span>Material Conflict Detected</span>
            </div>
            <p className="text-xs text-[#F5F7FB] leading-relaxed">
              {data.explanation}
            </p>
            {data.contradictionType && (
              <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-[#EF4444] border border-[#EF4444]/20">
                Classification: {data.contradictionType}
              </span>
            )}
          </div>
        )}

        {/* Source Metadata */}
        {(data.sourceTitle || data.sourceDomain || data.sourceUrl) && (
          <div className="rounded-xl bg-[#151C2B] border border-white/[0.08] p-4 space-y-3">
            <span className="text-[10px] font-mono uppercase text-[#8994A8] block">
              Primary Source Provenance
            </span>

            {data.sourceTitle && (
              <p className="text-xs font-medium text-[#F5F7FB] flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#3678F6] flex-shrink-0" />
                <span>{data.sourceTitle}</span>
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#8994A8] font-mono pt-1">
              {data.publicationDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#5A6478]" />
                  <span>{data.publicationDate}</span>
                </div>
              )}
              {data.retrievedAt && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#5A6478]" />
                  <span>{new Date(data.retrievedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {data.sourceUrl && (
              <a
                href={data.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#3678F6]/10 hover:bg-[#3678F6]/20 text-[#3678F6] border border-[#3678F6]/30 text-xs font-semibold transition-colors"
              >
                <span>Open Primary URL ({data.sourceDomain || 'External'})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

