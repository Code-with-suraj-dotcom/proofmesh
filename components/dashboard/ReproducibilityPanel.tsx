'use client';

import React, { useState, useEffect } from 'react';
import {
  GitCommit,
  GitCompare,
  Plus,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { ResearchSnapshot, SnapshotComparison } from '@/research-engine/reproducibility';

interface Props {
  sessionId: string;
}

export function ReproducibilityPanel({ sessionId }: Props) {
  const [snapshots, setSnapshots] = useState<ResearchSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Comparator states
  const [versionA, setVersionA] = useState<number>(1);
  const [versionB, setVersionB] = useState<number>(1);
  const [comparison, setComparison] = useState<SnapshotComparison | null>(null);
  const [comparing, setComparing] = useState(false);

  const fetchSnapshots = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/research/${sessionId}/snapshots`);
      if (res.ok) {
        const data = await res.json();
        const list: ResearchSnapshot[] = data.snapshots || [];
        setSnapshots(list);
        if (list.length >= 2) {
          setVersionA(list[0].version);
          setVersionB(list[list.length - 1].version);
        } else if (list.length === 1) {
          setVersionA(list[0].version);
          setVersionB(list[0].version);
        }
      }
    } catch (err) {
      console.error('Failed to fetch snapshots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, [sessionId]);

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await fetch(`/api/research/${sessionId}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          label: snapshotLabel || 'Manual Milestone Snapshot',
        }),
      });
      if (res.ok) {
        setSnapshotLabel('');
        setShowCreateModal(false);
        fetchSnapshots();
      }
    } catch (err) {
      console.error('Failed to create snapshot:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleCompare = async () => {
    try {
      setComparing(true);
      const res = await fetch(`/api/research/${sessionId}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compare',
          versionA,
          versionB,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setComparison(data.comparison);
      }
    } catch (err) {
      console.error('Failed to compare snapshots:', err);
    } finally {
      setComparing(false);
    }
  };

  if (loading && snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-7 h-7 rounded-full border-2 border-[#3678F6]/20 border-t-[#3678F6] animate-spin"></div>
        <p className="text-xs font-mono text-[#8994A8]">
          Cataloging Versioned Research Snapshots...
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
                <GitCommit className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#F5F7FB]">
                Research Reproducibility & Immutable Snapshots
              </h2>
            </div>
            <p className="text-xs text-[#8994A8] max-w-2xl leading-relaxed">
              Every milestone can be frozen into an immutable versioned snapshot. Compare historical runs
              side-by-side to audit changes in evidence, claims, contradictions, and conclusion text.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-[#3678F6] hover:bg-[#3678F6]/90 text-white font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Freeze Milestone Snapshot</span>
            </button>
            <button
              onClick={fetchSnapshots}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#8994A8] hover:text-[#F5F7FB] border border-white/[0.08] transition-colors"
              title="Refresh Snapshots"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="rounded-xl bg-[#151C2B] border border-white/[0.1] p-5 space-y-4">
          <h4 className="text-sm font-semibold text-[#F5F7FB]">Create Frozen Research Snapshot</h4>
          <form onSubmit={handleCreateSnapshot} className="space-y-3">
            <input
              type="text"
              placeholder="e.g. Post-Peer Review Milestone or Final Defense Run"
              value={snapshotLabel}
              onChange={(e) => setSnapshotLabel(e.target.value)}
              className="w-full rounded-xl bg-[#101522] border border-white/[0.08] p-3 text-xs text-[#F5F7FB] placeholder-[#5A6478] focus:outline-none focus:border-[#3678F6]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#8994A8] hover:text-[#F5F7FB]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-1.5 rounded-lg bg-[#3678F6] hover:bg-[#3678F6]/90 text-white font-semibold text-xs disabled:opacity-50"
              >
                {creating ? 'Freezing...' : 'Save Snapshot'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Snapshot Version History Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#F5F7FB] flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-[#3678F6]" />
          <span>Versioned Snapshots History ({snapshots.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {snapshots.map((snap) => (
            <div
              key={snap.snapshot_id}
              className="rounded-xl bg-[#151C2B] border border-white/[0.08] p-5 space-y-3 hover:border-white/[0.15] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#3678F6]/20 text-[#3678F6] border border-[#3678F6]/30">
                  v{snap.version}
                </span>
                <span className="text-[10px] font-mono text-[#8994A8]">
                  {new Date(snap.created_at).toLocaleString()}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-[#F5F7FB]">{snap.label}</h4>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2 border-t border-white/[0.06]">
                <div>
                  <span className="text-[10px] text-[#8994A8] block">Sources</span>
                  <span className="text-[#F5F7FB] font-bold">{snap.metrics.total_sources}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8994A8] block">Claims</span>
                  <span className="text-[#F5F7FB] font-bold">{snap.metrics.total_claims}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8994A8] block">Verified</span>
                  <span className="text-[#20B77A] font-bold">{snap.metrics.verified_percentage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-Side Version Comparator */}
      <div className="rounded-2xl bg-[#151C2B] border border-white/[0.08] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#F5F7FB] flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-[#3678F6]" />
              <span>Side-by-Side Version Delta Comparator</span>
            </h3>
            <p className="text-xs text-[#8994A8]">
              Select two version milestones to compute structural diffs in empirical claims, sources, and conclusions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[#8994A8]">Compare:</span>
              <select
                value={versionA}
                onChange={(e) => setVersionA(Number(e.target.value))}
                className="bg-[#101522] border border-white/[0.08] rounded-lg px-2.5 py-1 text-[#F5F7FB] text-xs focus:outline-none"
              >
                {snapshots.map((s) => (
                  <option key={s.version} value={s.version}>
                    v{s.version} - {s.label.slice(0, 20)}
                  </option>
                ))}
              </select>
              <span className="text-[#8994A8]">with:</span>
              <select
                value={versionB}
                onChange={(e) => setVersionB(Number(e.target.value))}
                className="bg-[#101522] border border-white/[0.08] rounded-lg px-2.5 py-1 text-[#F5F7FB] text-xs focus:outline-none"
              >
                {snapshots.map((s) => (
                  <option key={s.version} value={s.version}>
                    v{s.version} - {s.label.slice(0, 20)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCompare}
              disabled={comparing || snapshots.length < 1}
              className="px-3.5 py-1.5 rounded-lg bg-[#3678F6] hover:bg-[#3678F6]/90 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {comparing ? (
                <div className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />
              ) : (
                <GitCompare className="w-3.5 h-3.5" />
              )}
              <span>Compare</span>
            </button>
          </div>
        </div>

        {/* Comparison Results */}
        {comparison && (
          <div className="space-y-4 pt-4 border-t border-white/[0.08] animate-in fade-in duration-200">
            {/* Diff Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-[#101522] border border-white/[0.06] p-3 text-center">
                <span className="text-[10px] font-mono uppercase text-[#8994A8] block">New Claims</span>
                <span className="text-xl font-bold font-mono text-[#20B77A]">
                  +{comparison.new_claims_count}
                </span>
              </div>
              <div className="rounded-xl bg-[#101522] border border-white/[0.06] p-3 text-center">
                <span className="text-[10px] font-mono uppercase text-[#8994A8] block">Recalibrated Claims</span>
                <span className="text-xl font-bold font-mono text-amber-400">
                  {comparison.modified_claims_count}
                </span>
              </div>
              <div className="rounded-xl bg-[#101522] border border-white/[0.06] p-3 text-center">
                <span className="text-[10px] font-mono uppercase text-[#8994A8] block">Sources Delta</span>
                <span className="text-xl font-bold font-mono text-[#3678F6]">
                  {comparison.source_delta >= 0 ? `+${comparison.source_delta}` : comparison.source_delta}
                </span>
              </div>
              <div className="rounded-xl bg-[#101522] border border-white/[0.06] p-3 text-center">
                <span className="text-[10px] font-mono uppercase text-[#8994A8] block">Contradictions Delta</span>
                <span className="text-xl font-bold font-mono text-[#EF4444]">
                  {comparison.contradiction_delta >= 0
                    ? `+${comparison.contradiction_delta}`
                    : comparison.contradiction_delta}
                </span>
              </div>
            </div>

            {/* Markdown Delta Explanation */}
            <div className="rounded-xl bg-[#101522] border border-white/[0.06] p-4 space-y-2">
              <span className="text-[10px] font-mono uppercase text-[#3678F6] block">
                Reproducibility Delta Synthesis:
              </span>
              <p className="text-xs text-[#F5F7FB] leading-relaxed">
                {comparison.conclusion_comparison.delta_explanation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

