'use client';

import React, { useState, useEffect } from 'react';
import {
  Flame,
  ShieldAlert,
  ShieldCheck,
  Scale,
  AlertTriangle,
  Send,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { AdversarialEvaluation } from '@/research-engine/adversarial';
import { AdversarialPairing } from '@/research-engine/compiler';

interface Metrics {
  total_predicates: number;
  proponent_claims_count: number;
  skeptic_claims_count: number;
  average_truth_index: number;
  supported_count: number;
  falsified_count: number;
  contested_count: number;
  contradictions_detected: number;
}

interface Props {
  sessionId: string;
}

export function AdversarialPanel({ sessionId }: Props) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [evaluations, setEvaluations] = useState<AdversarialEvaluation[]>([]);
  const [pairings, setPairings] = useState<AdversarialPairing[]>([]);
  const [loading, setLoading] = useState(true);
  const [critiqueClaimId, setCritiqueClaimId] = useState('');
  const [critiqueText, setCritiqueText] = useState('');
  const [submittingChallenge, setSubmittingChallenge] = useState(false);
  const [challengeSuccess, setChallengeSuccess] = useState(false);

  const fetchAdversarialData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/research/${sessionId}/adversarial`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setEvaluations(data.evaluations || []);
        setPairings(data.pairings || []);
      }
    } catch (err) {
      console.error('Failed to fetch adversarial evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdversarialData();
  }, [sessionId]);

  const handleAuditChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!critiqueText.trim()) return;

    try {
      setSubmittingChallenge(true);
      const res = await fetch(`/api/research/${sessionId}/adversarial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_id: critiqueClaimId || 'system-wide-challenge',
          skeptic_agent_name: 'Peer Review Skeptic Agent',
          critique: critiqueText,
        }),
      });

      if (res.ok) {
        setChallengeSuccess(true);
        setCritiqueText('');
        setTimeout(() => setChallengeSuccess(false), 3000);
        fetchAdversarialData();
      }
    } catch (err) {
      console.error('Failed to submit adversarial challenge:', err);
    } finally {
      setSubmittingChallenge(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-7 h-7 rounded-full border-2 border-[#EF4444]/20 border-t-[#EF4444] animate-spin"></div>
        <p className="text-xs font-mono text-[#8994A8]">
          Executing Adversarial Cross-Examination & Falsification Matrix...
        </p>
      </div>
    );
  }

  const truthPercent = metrics ? Math.round(metrics.average_truth_index * 100) : 50;

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#151C2B] to-[#101522] border border-white/[0.08] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30">
                <Flame className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#F5F7FB]">
                Adversarial Research & Falsification Engine
              </h2>
            </div>
            <p className="text-xs text-[#8994A8] max-w-2xl leading-relaxed">
              ProofMesh pits Proponent agents against dedicated Skeptic agents. Every core
              hypothesis must withstand strict Popperian falsification criteria rather than mere confirmation bias.
            </p>
          </div>

          <button
            onClick={fetchAdversarialData}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#8994A8] hover:text-[#F5F7FB] border border-white/[0.08] transition-colors"
            title="Refresh Adversarial Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dialectic Scorecard Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-[#151C2B] border border-white/[0.08] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#8994A8]">Swarm Truth Index</span>
              <Scale className="w-4 h-4 text-[#3678F6]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold font-mono ${truthPercent >= 70
                    ? 'text-[#20B77A]'
                    : truthPercent >= 45
                      ? 'text-amber-400'
                      : 'text-[#EF4444]'
                  }`}
              >
                {truthPercent}%
              </span>
              <span className="text-[10px] text-[#8994A8] font-mono">
                {truthPercent >= 70 ? 'Resilient' : truthPercent >= 45 ? 'Contested' : 'Falsified'}
              </span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full bg-[#101522] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full ${truthPercent >= 70
                    ? 'bg-[#20B77A]'
                    : truthPercent >= 45
                      ? 'bg-amber-400'
                      : 'bg-[#EF4444]'
                  }`}
                style={{ width: `${truthPercent}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl bg-[#151C2B] border border-white/[0.08] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#8994A8]">Proponent vs Skeptic</span>
              <ShieldCheck className="w-4 h-4 text-[#20B77A]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[#20B77A]">
                {metrics.proponent_claims_count}
              </span>
              <span className="text-sm font-mono text-[#8994A8]">vs</span>
              <span className="text-2xl font-bold font-mono text-[#EF4444]">
                {metrics.skeptic_claims_count}
              </span>
            </div>
            <span className="text-[10px] text-[#8994A8] font-mono block">
              Empirical claim distribution
            </span>
          </div>

          <div className="rounded-xl bg-[#151C2B] border border-white/[0.08] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#8994A8]">Falsified Hypotheses</span>
              <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[#EF4444]">
                {metrics.falsified_count}
              </span>
              <span className="text-[10px] text-[#8994A8] font-mono">
                of {metrics.total_predicates} tested
              </span>
            </div>
            <span className="text-[10px] text-[#8994A8] font-mono block">
              Null hypothesis triggered
            </span>
          </div>

          <div className="rounded-xl bg-[#151C2B] border border-white/[0.08] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#8994A8]">Active Contradictions</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {metrics.contradictions_detected}
              </span>
              <span className="text-[10px] text-[#8994A8] font-mono">
                conflicts flagged
              </span>
            </div>
            <span className="text-[10px] text-[#8994A8] font-mono block">
              Adaptive verification dispatched
            </span>
          </div>
        </div>
      )}

      {/* Falsifiable Predicates Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#F5F7FB] flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#3678F6]" />
            <span>Formulated Falsifiable Predicates & Adversarial Pairings</span>
          </h3>
          <span className="text-xs font-mono text-[#8994A8]">
            {evaluations.length} Predicates Evaluated
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {evaluations.map((evalItem) => {
            const pairing = pairings.find((p) => p.predicate_id === evalItem.predicate_id);
            const verdictColor =
              evalItem.verdict === 'supported'
                ? 'text-[#20B77A] bg-[#20B77A]/10 border-[#20B77A]/30'
                : evalItem.verdict === 'refuted'
                  ? 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30'
                  : evalItem.verdict === 'contested'
                    ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                    : 'text-[#8994A8] bg-white/[0.04] border-white/[0.08]';

            return (
              <div
                key={evalItem.predicate_id}
                className="rounded-xl bg-[#151C2B] border border-white/[0.08] p-5 space-y-4 hover:border-white/[0.15] transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 max-w-3xl">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#3678F6]">
                      Predicate #{evalItem.predicate_id.slice(0, 6)}
                    </span>
                    <h4 className="text-sm font-semibold text-[#F5F7FB] leading-snug">
                      {evalItem.statement}
                    </h4>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-md text-xs font-mono uppercase font-bold border ${verdictColor}`}
                  >
                    Verdict: {evalItem.verdict}
                  </span>
                </div>

                {/* Adversarial Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Proponent Stance */}
                  <div className="rounded-lg bg-[#101522] border border-[#20B77A]/20 p-3 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#20B77A] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Proponent Hypotheses ({evalItem.proponent_claims_count} claims)
                    </span>
                    <p className="text-[#8994A8] text-[11px] leading-relaxed">
                      Assigned Agent: {pairing?.proponent_specialization ? `${pairing.proponent_specialization} specialist` : 'Proponent Research Agent'}
                    </p>
                  </div>

                  {/* Skeptic / Counter Stance */}
                  <div className="rounded-lg bg-[#101522] border border-[#EF4444]/20 p-3 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#EF4444] flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Skeptic Challenge ({evalItem.skeptic_claims_count} counterclaims)
                    </span>
                    <p className="text-[#8994A8] text-[11px] leading-relaxed">
                      Falsification Criteria: &ldquo;{pairing?.falsification_criteria || 'Refuted by empirical capex and recovery metrics.'}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Evidence Rationale */}
                <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3 text-xs space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#8994A8] block">
                    Adversarial Synthesis Rationale:
                  </span>
                  <p className="text-[#F5F7FB]/90 leading-relaxed">
                    {evalItem.rationale}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inject Adversarial Challenge Form */}
      <div className="rounded-2xl bg-[#151C2B] border border-white/[0.08] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-[#EF4444]/10 text-[#EF4444]">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-[#F5F7FB]">
            Inject Skeptic Challenge / External Critique
          </h3>
        </div>
        <p className="text-xs text-[#8994A8]">
          Challenge an assertion with counter-evidence. The critique will be logged permanently into the
          evidence ledger's chain-of-custody.
        </p>

        <form onSubmit={handleAuditChallenge} className="space-y-3">
          <textarea
            value={critiqueText}
            onChange={(e) => setCritiqueText(e.target.value)}
            placeholder="State counterargument or contradicting empirical findings..."
            rows={3}
            className="w-full rounded-xl bg-[#101522] border border-white/[0.08] p-3 text-xs text-[#F5F7FB] placeholder-[#5A6478] focus:outline-none focus:border-[#EF4444]/50 transition-colors"
          />

          <div className="flex items-center justify-between">
            {challengeSuccess ? (
              <span className="text-xs font-mono text-[#20B77A] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Critique Audited into Immutable Chain of Custody</span>
              </span>
            ) : <span />}

            <button
              type="submit"
              disabled={submittingChallenge || !critiqueText.trim()}
              className="px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#EF4444]/90 text-white font-semibold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {submittingChallenge ? (
                <div className="w-3.5 h-3.5 rounded-full border border-white/30 border-t-white animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Record Skeptic Critique</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
