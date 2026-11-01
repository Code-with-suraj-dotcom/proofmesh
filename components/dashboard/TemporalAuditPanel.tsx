'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { TemporalDifferentialReport, ClaimDrift } from '@/research-engine/temporal';

interface Props {
  sessionId: string;
}

export function TemporalAuditPanel({ sessionId }: Props) {
  const [report, setReport] = useState<TemporalDifferentialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);

  const fetchTemporalData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/research/${sessionId}/temporal`);
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (err) {
      console.error('Failed to fetch temporal report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemporalData();
  }, [sessionId]);

  const handleRunAudit = async () => {
    try {
      setAuditing(true);
      const res = await fetch(`/api/research/${sessionId}/temporal`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (err) {
      console.error('Failed to run temporal audit:', err);
    } finally {
      setAuditing(false);
    }
  };

  if (loading && !report) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-7 h-7 rounded-full border-2 border-[#3678F6]/20 border-t-[#3678F6] animate-spin"></div>
        <p className="text-xs font-mono text-[#8994A8]">
          Executing Temporal Evidence Differential Analysis...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#151C2B] to-[#101522] border border-white/[0.08] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#3678F6]/10 text-[#3678F6] border border-[#3678F6]/30">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#F5F7FB]">
                Temporal Intelligence & Source Drift Monitor
              </h2>
            </div>
            <p className="text-xs text-[#8994A8] max-w-2xl leading-relaxed">
              Research conclusions degrade as real-world regulations, commodity prices, and technologies
              evolve. ProofMesh monitors source passages over time and detects material claim drift.
            </p>
          </div>

          <button
            onClick={handleRunAudit}
            disabled={auditing}
            className="px-4 py-2 rounded-xl bg-[#3678F6] hover:bg-[#3678F6]/90 text-white font-semibold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {auditing ? (
              <div className="w-3.5 h-3.5 rounded-full border border-white/30 border-t-white animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Run Temporal Differential Audit</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-[#151C2B] border border-white/[0.08] p-4 space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#8994A8]">Sources Monitored</span>
            <p className="text-2xl font-bold font-mono text-[#F5F7FB]">
              {report.sources_monitored}
            </p>
            <span className="text-[10px] text-[#5A6478] font-mono">
              Live web targets tracked
            </span>
          </div>

          <div className="rounded-xl bg-[#151C2B] border border-white/[0.08] p-4 space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#8994A8]">Sources Updated</span>
            <p className="text-2xl font-bold font-mono text-amber-400">
              {report.sources_updated}
            </p>
            <span className="text-[10px] text-[#5A6478] font-mono">
              Amended passage text detected
            </span>
          </div>

          <div className="rounded-xl bg-[#151C2B] border border-white/[0.08] p-4 space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#8994A8]">Claim Drift Events</span>
            <p className="text-2xl font-bold font-mono text-[#EF4444]">
              {report.claim_drifts.length}
            </p>
            <span className="text-[10px] text-[#5A6478] font-mono">
              Stance / confidence shifted
            </span>
          </div>

          <div className="rounded-xl bg-[#151C2B] border border-white/[0.08] p-4 space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#8994A8]">Verdict Shift</span>
            <p
              className={`text-sm font-bold font-mono uppercase ${
                report.verdict_shift.shift_detected ? 'text-[#EF4444]' : 'text-[#20B77A]'
              }`}
            >
              {report.verdict_shift.shift_detected ? 'Shift Detected' : 'Maintained'}
            </p>
            <span className="text-[10px] text-[#5A6478] font-mono">
              Empirical synthesis status
            </span>
          </div>
        </div>
      )}

      {/* Verdict Shift Banner */}
      {report && (
        <div
          className={`rounded-2xl border p-5 space-y-3 ${
            report.verdict_shift.shift_detected
              ? 'bg-[#EF4444]/10 border-[#EF4444]/30'
              : 'bg-[#20B77A]/10 border-[#20B77A]/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {report.verdict_shift.shift_detected ? (
              <ShieldAlert className="w-5 h-5 text-[#EF4444]" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#20B77A]" />
            )}
            <h3 className="text-sm font-bold text-[#F5F7FB]">
              {report.verdict_shift.shift_detected
                ? 'Material Temporal Drift Flagged: Research Verdict Recalibrated'
                : 'Temporal Stability Verified: Baseline Conclusions Hold'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl bg-[#101522]/80 p-3 border border-white/[0.06] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#8994A8]">
                Baseline Conclusion ({new Date(report.baseline_timestamp).toLocaleDateString()}):
              </span>
              <p className="text-[#F5F7FB] font-semibold">{report.verdict_shift.previous}</p>
            </div>

            <div className="rounded-xl bg-[#101522]/80 p-3 border border-white/[0.06] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#8994A8]">
                Current Recalibrated Verdict ({new Date(report.audit_timestamp).toLocaleDateString()}):
              </span>
              <p className="text-[#F5F7FB] font-semibold">{report.verdict_shift.current}</p>
            </div>
          </div>

          <p className="text-xs text-[#8994A8] leading-relaxed pt-1">
            <span className="font-semibold text-[#F5F7FB]">Root Cause: </span>
            {report.verdict_shift.explanation}
          </p>
        </div>
      )}

      {/* Claim Drift Feed */}
      {report && report.claim_drifts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F5F7FB] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Cataloged Claim Drifts ({report.claim_drifts.length})</span>
            </h3>
          </div>

          <div className="space-y-3">
            {report.claim_drifts.map((drift: ClaimDrift, idx: number) => (
              <div
                key={idx}
                className="rounded-xl bg-[#151C2B] border border-white/[0.08] p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#F5F7FB]">
                    {drift.claim_text}
                  </span>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[#8994A8]">
                      {drift.original_stance} ({Math.round(drift.original_confidence * 100)}%)
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#3678F6]" />
                    <span className="px-2 py-0.5 rounded bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 font-bold">
                      {drift.new_stance} ({Math.round(drift.new_confidence * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-[#101522] border border-white/[0.06] p-3 text-xs text-[#8994A8]">
                  <span className="text-[10px] font-mono uppercase text-[#3678F6] block mb-1">
                    Drift Explanation:
                  </span>
                  <p>{drift.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

