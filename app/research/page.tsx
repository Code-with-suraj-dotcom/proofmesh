'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  Sliders,
  Filter,
  Clock,
  Compass,
  CheckCircle,
  AlertCircle,
  FileText,
  Bot,
} from 'lucide-react';
import { ResearchDepth, ResearchSession } from '@/types/research';

const PRESET_QUERIES = [
  {
    title: 'Battery Recycling Economics in India',
    query: 'Are current battery recycling technologies economically viable at small scale in India, considering capital costs, government regulations, technology efficiency, and environmental impact?',
    depth: 'deep' as ResearchDepth,
    domains: ['cpcb.nic.in', 'sciencedirect.com', 'niti.gov.in', 'crisil.com'],
  },
  {
    title: 'Microkernel Safety-Critical Robotics',
    query: 'What are the commercial and latency trade-offs between monolithic Linux kernels and formally verified microkernels (seL4) in safety-critical industrial robotics?',
    depth: 'standard' as ResearchDepth,
    domains: ['acm.org', 'ieee.org', 'sel4.systems'],
  },
  {
    title: 'EU AI Act Open-Weight Model Impact',
    query: 'How do EU AI Act copyright transparency and systemic risk compliance mandates affect European developers of open-weight foundation models?',
    depth: 'standard' as ResearchDepth,
    domains: ['europa.eu', 'arxiv.org'],
  },
];

export default function ResearchWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs font-mono text-[#8994A8]">
          Loading Research Workspace...
        </div>
      }
    >
      <WorkspaceContent />
    </Suspense>
  );
}

function WorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<ResearchDepth>('standard');
  const [domainFilterInput, setDomainFilterInput] = useState('');
  const [domainFilters, setDomainFilters] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<ResearchSession[]>([]);

  // Check preset in query
  useEffect(() => {
    const preset = searchParams?.get('preset');
    if (preset === 'battery') {
      setQuery(PRESET_QUERIES[0].query);
      setDepth(PRESET_QUERIES[0].depth);
      setDomainFilters(PRESET_QUERIES[0].domains);
    }
  }, [searchParams]);

  // Fetch past sessions
  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await fetch('/api/research');
        if (res.ok) {
          const data = await res.json();
          setPastSessions(data.sessions || []);
        }
      } catch (err) {
        console.error('Failed to load past sessions:', err);
      }
    }
    loadSessions();
  }, []);

  const handleAddDomain = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && domainFilterInput.trim()) {
      e.preventDefault();
      const clean = domainFilterInput.trim().toLowerCase().replace(/^https?:\/\//, '');
      if (!domainFilters.includes(clean)) {
        setDomainFilters([...domainFilters, clean]);
      }
      setDomainFilterInput('');
    }
  };

  const removeDomain = (d: string) => {
    setDomainFilters(domainFilters.filter((x) => x !== d));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 5) {
      setError('Please provide a research question with at least 5 characters.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          depth,
          domain_filters: domainFilters,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start research session');
      }

      const { sessionId } = await response.json();
      router.push(`/research/${sessionId}/live`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 text-left">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#3678F6] bg-[#3678F6]/10 px-2.5 py-1 rounded-full border border-[#3678F6]/20">
          <Bot className="w-3.5 h-3.5" />
          <span>Autonomous Research Scientist</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#F5F7FB] tracking-tight">
          Research Investigation Workspace
        </h1>
        <p className="text-sm text-[#8994A8] max-w-2xl">
          Submit any complex empirical, technical, or market question. The Master Planner will
          decompose hypotheses, dispatch autonomous TinyFish web agents, and build an explainable
          evidence graph.
        </p>
      </div>

      {/* Main Input Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-[#101522] border border-white/[0.08] p-6 sm:p-8 shadow-2xl space-y-6"
      >
        {/* Large Question Input */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-[#8994A8] block">
            Research Question or Thesis
          </label>
          <textarea
            rows={4}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Are current battery recycling technologies economically viable at small scale in India, considering capital costs, government regulations, technology efficiency, and environmental impact?"
            className="w-full rounded-xl bg-[#151C2B] border border-white/[0.08] focus:border-[#3678F6] p-4 text-sm text-[#F5F7FB] placeholder-[#5A6478] focus:outline-none transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* Depth & Configuration Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Depth Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-[#8994A8] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#3678F6]" />
              <span>Investigation Depth</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['quick', 'standard', 'deep'] as ResearchDepth[]).map((d) => {
                const isSelected = depth === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDepth(d)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold capitalize transition-all ${
                      isSelected
                        ? 'bg-[#3678F6]/20 border-[#3678F6] text-white shadow-sm shadow-[#3678F6]/30'
                        : 'bg-[#151C2B] border-white/[0.06] text-[#8994A8] hover:text-[#F5F7FB]'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#5A6478] font-mono">
              {depth === 'quick' && '3-5 objectives, fast targeted validation (~30s).'}
              {depth === 'standard' && '5-8 objectives, balanced multi-agent analysis (~60s).'}
              {depth === 'deep' && '7-12 objectives, exhaustive multi-source cross-examination.'}
            </p>
          </div>

          {/* Domain Filters */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-[#8994A8] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#20B77A]" />
              <span>Optional Domain Filters (Press Enter)</span>
            </label>
            <input
              type="text"
              value={domainFilterInput}
              onChange={(e) => setDomainFilterInput(e.target.value)}
              onKeyDown={handleAddDomain}
              placeholder="e.g. sciencedirect.com, niti.gov.in"
              className="w-full rounded-lg bg-[#151C2B] border border-white/[0.08] focus:border-[#20B77A] px-3 py-2 text-xs text-[#F5F7FB] placeholder-[#5A6478] focus:outline-none"
            />
            {domainFilters.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {domainFilters.map((df) => (
                  <span
                    key={df}
                    onClick={() => removeDomain(df)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-[11px] font-mono text-[#F5F7FB] cursor-pointer hover:border-[#EF4444] hover:text-[#EF4444]"
                  >
                    {df} &times;
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 p-3 text-xs text-[#EF4444] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-[#8994A8] hidden sm:block">
            Dispatches autonomous TinyFish agents & Gemini Swarm
          </span>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#3678F6] hover:bg-[#3678F6]/90 disabled:opacity-50 text-white font-semibold text-sm shadow-xl shadow-[#3678F6]/25 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                <span>Orchestrating Swarm...</span>
              </>
            ) : (
              <>
                <span>Launch Autonomous Research</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preset Inspirations */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-[#8994A8]">
          Investigation Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_QUERIES.map((p, i) => (
            <div
              key={i}
              onClick={() => {
                setQuery(p.query);
                setDepth(p.depth);
                setDomainFilters(p.domains);
              }}
              className="rounded-xl bg-[#101522] border border-white/[0.06] hover:border-[#3678F6]/50 p-4 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-[#3678F6]">
                  {p.depth} Investigation
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#5A6478] group-hover:text-[#3678F6] group-hover:translate-x-0.5 transition-all" />
              </div>
              <h4 className="text-xs font-semibold text-[#F5F7FB] leading-snug">
                {p.title}
              </h4>
              <p className="text-[11px] text-[#8994A8] line-clamp-2 leading-relaxed">
                {p.query}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Past Investigations History */}
      {pastSessions.length > 0 && (
        <div id="history" className="space-y-3 pt-6 border-t border-white/[0.08]">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#8994A8] flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#8994A8]" />
            <span>Past Research Sessions</span>
          </h3>
          <div className="rounded-2xl bg-[#101522] border border-white/[0.08] divide-y divide-white/[0.04] overflow-hidden">
            {pastSessions.map((s) => (
              <div
                key={s.id}
                onClick={() => router.push(`/research/${s.id}`)}
                className="p-4 hover:bg-white/[0.02] cursor-pointer transition-colors flex items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <h4 className="text-xs font-semibold text-[#F5F7FB] truncate">
                    {s.query}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-[#8994A8]">
                    <span>{new Date(s.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="uppercase text-[#3678F6]">{s.depth}</span>
                    <span>•</span>
                    <span>{s.claims_extracted || 0} claims</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                      s.status === 'completed'
                        ? 'bg-[#20B77A]/10 text-[#20B77A] border-[#20B77A]/20'
                        : s.status === 'partially_completed'
                        ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                        : s.status === 'failed'
                        ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
                        : 'bg-[#3678F6]/10 text-[#3678F6] border-[#3678F6]/20'
                    }`}
                  >
                    {s.status.replace('_', ' ')}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#5A6478]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

