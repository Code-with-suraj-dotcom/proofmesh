import Link from 'next/link';
import {
  Sparkles,
  Network,
  ShieldCheck,
  Bot,
  Flame,
  ArrowRight,
  Database,
  ExternalLink,
  Layers,
  Cpu,
  Search,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-24">
      {/* HERO SECTION */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#101522] border border-white/[0.08] text-xs text-[#8994A8] shadow-inner">
          <span className="w-2 h-2 rounded-full bg-[#20B77A] animate-pulse"></span>
          <span>ProofMesh Multi-Agent Swarm 2.0</span>
          <span className="text-[#3678F6] font-semibold">Live Web Verification</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#F5F7FB] leading-[1.1]">
          Turn the live web into an{' '}
          <span className="bg-gradient-to-r from-[#3678F6] via-[#60A5FA] to-[#20B77A] bg-clip-text text-transparent">
            explainable evidence graph.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-[#8994A8] max-w-2xl mx-auto leading-relaxed">
          An autonomous research scientist that investigates complex questions, validates claims
          across independent sources, detects empirical contradictions, and makes every conclusion
          fully auditable down to verbatim source passages.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/research"
            className="px-6 py-3.5 rounded-xl bg-[#3678F6] hover:bg-[#3678F6]/90 text-white font-semibold text-sm shadow-xl shadow-[#3678F6]/25 transition-all flex items-center gap-2 group"
          >
            <span>Start Autonomous Research</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/research?preset=battery"
            className="px-6 py-3.5 rounded-xl bg-[#101522] hover:bg-[#151C2B] border border-white/[0.08] text-[#F5F7FB] font-medium text-sm transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#3678F6]" />
            <span>Explore Battery Economics Example</span>
          </Link>
        </div>
      </div>

      {/* ANIMATED EVIDENCE GRAPH PREVIEW */}
      <div className="w-full max-w-5xl mx-auto rounded-2xl bg-gradient-to-b from-[#151C2B] to-[#080B12] border border-white/[0.08] p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span className="w-3 h-3 rounded-full bg-[#20B77A]"></span>
            <span className="text-xs font-mono text-[#8994A8] ml-2">
              live-graph // battery-recycling-india.pm
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#20B77A]/10 text-[#20B77A] border border-[#20B77A]/20">
            Audit Verified
          </span>
        </div>

        {/* Mock Top visual DAG */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-[#101522] border border-[#3678F6]/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#3678F6]">Hypothesis</span>
              <span className="text-[10px] text-[#8994A8] font-mono">sub-1</span>
            </div>
            <h4 className="text-xs font-semibold text-[#F5F7FB]">
              Hydrometallurgical Capex Penalties at Small Scale
            </h4>
            <p className="text-[11px] text-[#8994A8] leading-relaxed">
              Levelized processing costs exceed $3,450/ton for sub-500 ton plants due to fixed reagent
              and effluent costs.
            </p>
          </div>

          <div className="rounded-xl bg-[#101522] border border-[#20B77A]/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#20B77A]">Supporting Evidence</span>
              <span className="text-[10px] text-[#20B77A] font-mono">94% Confidence</span>
            </div>
            <h4 className="text-xs font-semibold text-[#F5F7FB]">
              &ldquo;Below 300 t/yr, fixed reagent costs render distributed recycling unviable...&rdquo;
            </h4>
            <span className="text-[10px] font-mono text-[#8994A8] flex items-center gap-1">
              <ExternalLink className="w-3 h-3 text-[#3678F6]" />
              sciencedirect.com (Peer-Reviewed)
            </span>
          </div>

          <div className="rounded-xl bg-[#101522] border border-[#EF4444]/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#EF4444]">Contradiction Detected</span>
              <span className="text-[10px] text-[#EF4444] font-mono">Critical Conflict</span>
            </div>
            <h4 className="text-xs font-semibold text-[#F5F7FB]">
              Methodological Capex Divergence ($4.2M vs $180k)
            </h4>
            <p className="text-[11px] text-[#8994A8] leading-relaxed">
              Direct mechanochemical recovery yields 18.2% EBITDA with capex &lt;$180k, contradicting
              centralized hydrometallurgy assumptions.
            </p>
          </div>
        </div>
      </div>

      {/* 4 PILLARS SECTION */}
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-bold text-[#F5F7FB]">
            Engineered for Deep Academic & Market Intelligence
          </h2>
          <p className="text-sm text-[#8994A8] max-w-xl mx-auto">
            ProofMesh replaces black-box hallucinations with an auditable forensic reasoning pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <div className="rounded-2xl bg-[#101522] border border-white/[0.08] p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#3678F6]/10 text-[#3678F6] border border-[#3678F6]/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#F5F7FB]">Dynamic Swarm Orchestration</h3>
            <p className="text-xs text-[#8994A8] leading-relaxed">
              Master Planner decomposes queries dynamically into specialized agents with bounded
              concurrency and isolated error boundaries.
            </p>
          </div>

          <div className="rounded-2xl bg-[#101522] border border-white/[0.08] p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#20B77A]/10 text-[#20B77A] border border-[#20B77A]/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-[#20B77A]" />
            </div>
            <h3 className="text-base font-semibold text-[#F5F7FB]">TinyFish Web Agent Engine</h3>
            <p className="text-xs text-[#8994A8] leading-relaxed">
              Autonomous browser agents navigate live websites, extract primary documents, and parse
              passages without synthetic scraping shortcuts.
            </p>
          </div>

          <div className="rounded-2xl bg-[#101522] border border-white/[0.08] p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-[#EF4444]" />
            </div>
            <h3 className="text-base font-semibold text-[#F5F7FB]">Contradiction Detection</h3>
            <p className="text-xs text-[#8994A8] leading-relaxed">
              Isolates conflicting financial metrics, chronological shifts, and geographic contexts,
              spawning targeted adaptive verification tasks.
            </p>
          </div>

          <div className="rounded-2xl bg-[#101522] border border-white/[0.08] p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#F5F7FB]">Zero-Fabrication Guarantee</h3>
            <p className="text-xs text-[#8994A8] leading-relaxed">
              Every factual sentence in reports and graphs is permanently linked to an exact verbatim
              passage from an authenticated URL.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Globe(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
