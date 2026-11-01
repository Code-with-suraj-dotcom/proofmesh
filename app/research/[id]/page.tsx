'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Compass,
  Network,
  BookOpen,
  FileText,
  ShieldCheck,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowLeft,
  Download,
  Copy,
  ExternalLink,
  Bot,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { MasterPlannerPanel } from '@/components/dashboard/MasterPlannerPanel';
import { AgentGrid } from '@/components/dashboard/AgentGrid';
import { LiveEvidenceStream } from '@/components/dashboard/LiveEvidenceStream';
import { EvidenceGraph } from '@/components/graph/EvidenceGraph';
import { ResearchSession, ResearchReport } from '@/types/research';
import { ResearchObjective, ResearchAgentTask, WebsiteTask } from '@/types/agents';
import { FullEvidenceGraph } from '@/types/graph';

type ActiveTab = 'overview' | 'graph' | 'sources' | 'report';

export default function ResearchResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [objectives, setObjectives] = useState<ResearchObjective[]>([]);
  const [agents, setAgents] = useState<ResearchAgentTask[]>([]);
  const [websiteTasks, setWebsiteTasks] = useState<WebsiteTask[]>([]);
  const [graphData, setGraphData] = useState<FullEvidenceGraph | null>(null);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [sourcesCount, setSourcesCount] = useState(0);
  const [claimsCount, setClaimsCount] = useState(0);
  const [contradictionsCount, setContradictionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Poll or refresh session data periodically if still active
  const fetchData = async () => {
    if (!sessionId) return;
    try {
      const [resDetails, resGraph] = await Promise.all([
        fetch(`/api/research/${sessionId}`),
        fetch(`/api/research/${sessionId}/graph`),
      ]);

      if (resDetails.ok) {
        const data = await resDetails.json();
        setSession(data.session);
        setObjectives(data.objectives || []);
        setAgents(data.agents || []);
        setWebsiteTasks(data.websiteTasks || []);
        setSourcesCount(data.sourcesCount || 0);
        setClaimsCount(data.claimsCount || 0);
        setContradictionsCount(data.contradictionsCount || 0);
        setReport(data.report || null);
      }

      if (resGraph.ok) {
        const graph = await resGraph.json();
        setGraphData(graph);
      }
    } catch (err) {
      console.error('Failed to fetch research session details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh interval while session is actively running
    const interval = setInterval(() => {
      if (
        session &&
        (session.status === 'completed' ||
          session.status === 'partially_completed' ||
          session.status === 'failed' ||
          session.status === 'cancelled')
      ) {
        clearInterval(interval);
      } else {
        fetchData();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [sessionId, session?.status]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to halt this research investigation?')) return;
    await fetch(`/api/research/${sessionId}/cancel`, { method: 'POST' });
    fetchData();
  };

  const handleCopyReport = () => {
    if (report?.content_markdown) {
      navigator.clipboard.writeText(report.content_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading && !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-[#3678F6]/20 border-t-[#3678F6] animate-spin"></div>
        <p className="text-xs font-mono text-[#8994A8]">
          Connecting to ProofMesh Forensic Research Swarm...
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-4">
        <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
        <h2 className="text-lg font-semibold text-[#F5F7FB]">Investigation Not Found</h2>
        <Link href="/research" className="text-xs text-[#3678F6] hover:underline">
          Return to Workspace
        </Link>
      </div>
    );
  }

  const isCompleted = session.status === 'completed' || session.status === 'partially_completed';
  const isRunning = !isCompleted && session.status !== 'failed' && session.status !== 'cancelled';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/research"
            className="p-1.5 rounded-lg bg-[#151C2B] text-[#8994A8] hover:text-[#F5F7FB] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-[#8994A8]">Session ID:</span>
              <span className="text-[10px] font-mono text-[#3678F6]">{session.id.slice(0, 8)}...</span>
              <span className="text-[10px] font-mono text-[#5A6478]">
                {new Date(session.created_at).toLocaleString()}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#F5F7FB] truncate">
              {session.query}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isRunning && (
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-lg bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Halt Swarm</span>
            </button>
          )}

          <div
            className={`px-3 py-1 rounded-full border text-xs font-mono uppercase flex items-center gap-1.5 ${isCompleted
              ? 'bg-[#20B77A]/10 text-[#20B77A] border-[#20B77A]/30'
              : session.status === 'failed'
                ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                : 'bg-[#3678F6]/10 text-[#3678F6] border-[#3678F6]/30 animate-pulse'
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isCompleted
                ? 'bg-[#20B77A]'
                : session.status === 'failed'
                  ? 'bg-[#EF4444]'
                  : 'bg-[#3678F6]'
                }`}
            ></span>
            <span>{session.status.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Primary 4 Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${activeTab === 'overview'
            ? 'border-[#3678F6] text-[#3678F6] bg-white/[0.02]'
            : 'border-transparent text-[#8994A8] hover:text-[#F5F7FB]'
            }`}
        >
          <Compass className="w-4 h-4" />
          <span>Swarm Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('graph')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${activeTab === 'graph'
            ? 'border-[#3678F6] text-[#3678F6] bg-white/[0.02]'
            : 'border-transparent text-[#8994A8] hover:text-[#F5F7FB]'
            }`}
        >
          <Network className="w-4 h-4" />
          <span>Evidence Graph</span>
          {graphData && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#3678F6]/20 text-[#3678F6]">
              {graphData.nodes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${activeTab === 'sources'
            ? 'border-[#3678F6] text-[#3678F6] bg-white/[0.02]'
            : 'border-transparent text-[#8994A8] hover:text-[#F5F7FB]'
            }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Primary Sources</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.08] text-[#8994A8]">
            {sourcesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${activeTab === 'report'
            ? 'border-[#3678F6] text-[#3678F6] bg-white/[0.02]'
            : 'border-transparent text-[#8994A8] hover:text-[#F5F7FB]'
            }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audited Report</span>
          {report && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#20B77A]/20 text-[#20B77A]">
              Ready
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: SWARM OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-xl bg-[#101522] border border-white/[0.08] p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#8994A8] block">Objectives</span>
              <span className="text-xl font-bold text-[#3678F6]">{objectives.length}</span>
            </div>

            <div className="rounded-xl bg-[#101522] border border-white/[0.08] p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#8994A8] block">Agents</span>
              <span className="text-xl font-bold text-[#F5F7FB]">{agents.length}</span>
            </div>

            <div className="rounded-xl bg-[#101522] border border-white/[0.08] p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#8994A8] block">Websites Searched</span>
              <span className="text-xl font-bold text-[#F5F7FB]">{session.total_website_tasks || websiteTasks.length}</span>
            </div>

            <div className="rounded-xl bg-[#101522] border border-white/[0.08] p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#8994A8] block">Primary Sources</span>
              <span className="text-xl font-bold text-[#F5F7FB]">{sourcesCount}</span>
            </div>

            <div className="rounded-xl bg-[#101522] border border-white/[0.08] p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#8994A8] block">Verified Claims</span>
              <span className="text-xl font-bold text-[#20B77A]">{claimsCount}</span>
            </div>

            <div className="rounded-xl bg-[#101522] border border-white/[0.08] p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#EF4444] block">Contradictions</span>
              <span className="text-xl font-bold text-[#EF4444]">{contradictionsCount}</span>
            </div>
          </div>

          {/* Executive Summary if generated */}
          {session.executive_summary && (
            <div className="rounded-2xl bg-[#101522] border border-white/[0.08] p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#20B77A]">
                <ShieldCheck className="w-4 h-4" />
                <span>Executive Synthesis</span>
              </div>
              <p className="text-sm text-[#F5F7FB] leading-relaxed">
                {session.executive_summary}
              </p>
            </div>
          )}

          {/* Level 1 Master Planner Panel */}
          <MasterPlannerPanel session={session} objectives={objectives} />

          {/* Level 2 & 3 Autonomous Agent Swarm Grid & Website Task Inspector */}
          <AgentGrid agents={agents} />

          {/* Level 4 Live Streaming Console */}
          <LiveEvidenceStream sessionId={sessionId} />
        </div>
      )}

      {/* TAB 2: INTERACTIVE EVIDENCE GRAPH */}
      {activeTab === 'graph' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#F5F7FB]">
                Explainable Multi-Agent Evidence Graph
              </h3>
              <p className="text-xs text-[#8994A8]">
                Click any evidence claim to inspect its verbatim source quote, URL, and confidence rationale.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-[#8994A8]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3678F6]"></span> Hypotheses
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#20B77A]"></span> Supporting
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span> Contradictions
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8994A8]"></span> Sources
              </span>
            </div>
          </div>

          {graphData && graphData.nodes.length > 0 ? (
            <EvidenceGraph initialGraph={graphData} />
          ) : (
            <div className="h-[400px] rounded-2xl bg-[#101522] border border-white/[0.08] flex items-center justify-center text-xs text-[#8994A8]">
              Graph topology is being synthesized from incoming research findings...
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SOURCES EXPLORER */}
      {activeTab === 'sources' && (
        <SourcesView sessionId={sessionId} />
      )}

      {/* TAB 4: AUDITED REPORT */}
      {activeTab === 'report' && (
        <ReportView
          report={report}
          onCopy={handleCopyReport}
          copied={copied}
        />
      )}
    </div>
  );
}

// Sub-view: Sources
function SourcesView({ sessionId }: { sessionId: string }) {
  const [sources, setSources] = useState<any[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/research/${sessionId}/sources`);
        if (res.ok) {
          const data = await res.json();
          setSources(data.sources || []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  const filtered = sources.filter((s) => {
    const text = (s.title + s.domain + s.url).toLowerCase();
    return text.includes(filterQuery.toLowerCase());
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#F5F7FB]">
            Primary Source Registry ({sources.length} Discovered Sources)
          </h3>
          <p className="text-xs text-[#8994A8]">
            Every source is audited for domain authority and verbatim passage integrity.
          </p>
        </div>
        <input
          type="text"
          placeholder="Filter by domain or keyword..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="rounded-lg bg-[#151C2B] border border-white/[0.08] px-3 py-1.5 text-xs text-[#F5F7FB] focus:outline-none w-64"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="rounded-xl bg-[#101522] border border-white/[0.08] p-4 space-y-3 shadow-lg"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono text-[#3678F6] uppercase">
                  {s.source_type?.replace('_', ' ')}
                </span>
                <h4 className="text-xs font-semibold text-[#F5F7FB] leading-snug">
                  {s.title}
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#20B77A]/10 text-[#20B77A] border border-[#20B77A]/20">
                Score: {s.credibility_assessment?.score || 90}/100
              </span>
            </div>

            {s.content_snippet && (
              <p className="text-[11px] text-[#8994A8] leading-relaxed line-clamp-3 bg-[#151C2B] p-2.5 rounded-lg border border-white/[0.04]">
                &ldquo;{s.content_snippet}&rdquo;
              </p>
            )}

            <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-[#8994A8]">
              <span>Claims Extracted: <strong>{s.claim_count || 0}</strong></span>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3678F6] hover:underline flex items-center gap-1"
              >
                <span>{s.domain}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Sub-view: Report
function ReportView({
  report,
  onCopy,
  copied,
}: {
  report: ResearchReport | null;
  onCopy: () => void;
  copied: boolean;
}) {
  if (!report) {
    return (
      <div className="h-[400px] rounded-2xl bg-[#101522] border border-white/[0.08] flex items-center justify-center text-xs text-[#8994A8]">
        Audited research report is currently being synthesized...
      </div>
    );
  }

  const handleDownload = () => {
    const blob = new Blob([report.content_markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proofmesh-report-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      {/* Report Actions Bar */}
      <div className="flex items-center justify-between bg-[#101522] border border-white/[0.08] p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#20B77A]" />
          <span className="text-xs font-semibold text-[#F5F7FB]">
            Comprehensive Audited Report (11 Sections)
          </span>
          <span className="text-[10px] font-mono text-[#8994A8] bg-white/[0.06] px-2 py-0.5 rounded">
            Coverage: {report.coverage_status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className="px-3 py-1.5 rounded-lg bg-[#151C2B] hover:bg-white/[0.08] text-xs font-medium text-[#F5F7FB] transition-colors flex items-center gap-1.5 border border-white/[0.06]"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg bg-[#151C2B] hover:bg-white/[0.08] text-xs font-medium text-[#F5F7FB] transition-colors flex items-center gap-1.5 border border-white/[0.06]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-[#3678F6] hover:bg-[#3678F6]/90 text-xs font-semibold text-white transition-colors"
          >
            Print / PDF
          </button>
        </div>
      </div>

      {/* Markdown Document Container */}
      <div className="rounded-2xl bg-[#101522] border border-white/[0.08] p-8 sm:p-12 shadow-2xl text-left space-y-6 text-[#F5F7FB]">
        <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans">
          {report.content_markdown}
        </div>
      </div>
    </div>
  );
}
