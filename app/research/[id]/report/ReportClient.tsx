'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Download } from 'lucide-react';
import { ResearchReport } from '@/types/research';

interface Props {
  sessionId: string;
}

export function ReportClient({ sessionId }: Props) {
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch(`/api/research/${sessionId}/report`);
        if (res.ok) {
          const data = await res.json();
          setReport(data.report);
        }
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [sessionId]);

  const handleCopy = () => {
    if (report?.content_markdown) {
      navigator.clipboard.writeText(report.content_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report.content_markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proofmesh-investigation-${sessionId.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/research/${sessionId}`}
            className="p-1.5 rounded-lg bg-[#151C2B] text-[#8994A8] hover:text-[#F5F7FB] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#F5F7FB]">
              Audited Research Report
            </h1>
            <p className="text-xs text-[#8994A8]">
              Comprehensive 11-section synthesis with claim-level primary source citations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-[#151C2B] hover:bg-white/[0.08] text-xs font-medium text-[#F5F7FB] transition-colors flex items-center gap-1.5 border border-white/[0.06]"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg bg-[#151C2B] hover:bg-white/[0.08] text-xs font-medium text-[#F5F7FB] transition-colors flex items-center gap-1.5 border border-white/[0.06]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-[#3678F6] hover:bg-[#3678F6]/90 text-xs font-semibold text-white transition-colors"
          >
            Print
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-24 text-xs text-[#8994A8]">Loading report...</div>
      ) : !report ? (
        <div className="text-center py-24 text-xs text-[#8994A8]">
          Report has not been generated for this session yet.
        </div>
      ) : (
        <div className="rounded-2xl bg-[#101522] border border-white/[0.08] p-8 sm:p-12 shadow-2xl space-y-6 text-[#F5F7FB]">
          <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {report.content_markdown}
          </div>
        </div>
      )}
    </div>
  );
}

