'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  ArrowLeft,
  Bot,
  Globe,
  Radio,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Pause,
  Play,
  RotateCw,
  Search,
  Filter,
  Copy,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Flame,
  FileText,
  Network,
  Sparkles,
  Layers,
  Lock,
} from 'lucide-react';
import { ResearchSession, ResearchEvent, ResearchReport } from '@/types/research';
import { ResearchObjective, ResearchAgentTask, WebsiteTask } from '@/types/agents';
import { Claim } from '@/types/evidence';
import { EvidenceDetailDrawer } from '@/components/graph/EvidenceDetailDrawer';
import { EvidenceNodeData } from '@/types/graph';

interface Props {
  sessionId: string;
}

export function LiveResearchClient({ sessionId }: Props) {
  const router = useRouter();

  // Core State
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [objectives, setObjectives] = useState<ResearchObjective[]>([]);
  const [agents, setAgents] = useState<ResearchAgentTask[]>([]);
  const [websiteTasks, setWebsiteTasks] = useState<WebsiteTask[]>([]);
  const [events, setEvents] = useState<ResearchEvent[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Observability & UI State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [eventSearch, setEventSearch] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const [copiedSessionId, setCopiedSessionId] = useState(false);
  const [selectedEvidenceNode, setSelectedEvidenceNode] = useState<EvidenceNodeData | null>(null);

  const eventStreamEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  // 1. Initial State Hydration from Database
  const fetchSessionState = async () => {
    if (!sessionId) return;
    try {
      const [resDetails, resClaims] = await Promise.all([
        fetch(`/api/research/${sessionId}`),
        fetch(`/api/research/${sessionId}/claims`),
      ]);

      if (resDetails.ok) {
        const data = await resDetails.json();
        setSession(data.session);
        setObjectives(data.objectives || []);
        setAgents(data.agents || []);
        setWebsiteTasks(data.websiteTasks || []);
        setReport(data.report || null);
      }

      if (resClaims.ok) {
        const claimsData = await resClaims.json();
        setClaims(claimsData.claims || []);
      }
    } catch (err) {
      console.error('[LiveConsole] Failed to hydrate session state:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Real-Time Event Streaming via SSE
  useEffect(() => {
    fetchSessionState();

    const sse = new EventSource(`/api/research/${sessionId}/stream`);
    sseRef.current = sse;

    sse.onmessage = (e) => {
      if (!e.data || e.data.startsWith(':')) return; // Ignore heartbeats
      try {
        const newEvent: ResearchEvent = JSON.parse(e.data);
        setEvents((prev) => {
          // Avoid duplicate event insertions using unique ID
          if (prev.some((item) => item.id === newEvent.id)) return prev;
          return [...prev, newEvent];
        });

        // Whenever an agent or task event occurs, refresh state
        if (
          newEvent.event_type.startsWith('agent_') ||
          newEvent.event_type.startsWith('website_') ||
          newEvent.event_type.startsWith('research_') ||
          newEvent.event_type === 'claim_extracted'
        ) {
          fetchSessionState();
        }
      } catch (err) {
        console.warn('[SSE] Parse error:', err);
      }
    };

    sse.onerror = () => {
      // Automatic browser reconnect
    };

    return () => {
      sse.close();
    };
  }, [sessionId]);

  // 3. Live Elapsed Time Counter
  useEffect(() => {
    if (!session?.created_at) return;
    const startMs = new Date(session.created_at).getTime();

    const updateTimer = () => {
      if (session.completed_at) {
        const endMs = new Date(session.completed_at).getTime();
        setElapsedSeconds(Math.max(0, Math.floor((endMs - startMs) / 1000)));
      } else {
        const nowMs = Date.now();
        setElapsedSeconds(Math.max(0, Math.floor((nowMs - startMs) / 1000)));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session?.created_at, session?.completed_at]);

  // Periodic polling safety net while session is active
  useEffect(() => {
    const isTerminal =
      session?.status === 'completed' ||
      session?.status === 'partially_completed' ||
      session?.status === 'failed' ||
      session?.status === 'cancelled';

    if (isTerminal) return;

    const pollInterval = setInterval(() => {
      fetchSessionState();
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [session?.status]);

  const handleCopySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopiedSessionId(true);
    setTimeout(() => setCopiedSessionId(false), 2000);
  };

  const handleCopyEvent = (event: ResearchEvent) => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopiedEventId(event.id);
    setTimeout(() => setCopiedEventId(null), 2000);
  };

  const handleCancelSwarm = async () => {
    if (!confirm('Are you sure you want to halt the autonomous research swarm? Extracted evidence will be preserved.')) return;
    await fetch(`/api/research/${sessionId}/cancel`, { method: 'POST' });
    fetchSessionState();
  };

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filtered Events
  const filteredEvents = events.filter((evt) => {
    const matchesFilter =
      eventFilter === 'all' ||
      (eventFilter === 'compiler' && evt.event_type.startsWith('compiler_')) ||
      (eventFilter === 'agents' && evt.event_type.startsWith('agent_')) ||
      (eventFilter === 'websites' && evt.event_type.startsWith('website_')) ||
      (eventFilter === 'evidence' && (evt.event_type.includes('claim') || evt.event_type.includes('source') || evt.event_type.includes('contradiction'))) ||
      (eventFilter === 'errors' && (evt.event_type.includes('failed') || evt.message.toLowerCase().includes('error')));

    const matchesSearch =
      eventSearch === '' ||
      evt.message.toLowerCase().includes(eventSearch.toLowerCase()) ||
      (evt.source_url && evt.source_url.toLowerCase().includes(eventSearch.toLowerCase())) ||
      (evt.agent_name && evt.agent_name.toLowerCase().includes(eventSearch.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  if (loading && !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-4 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#3678F6]/20 border-t-[#3678F6] animate-spin"></div>
        <p className="text-xs font-mono text-[#8994A8]">
          Initializing ProofMesh Real-Time Observability Engine...
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-4 text-center">
        <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
        <h2 className="text-lg font-semibold text-[#F5F7FB]">Research Session Not Found</h2>
        <Link href="/research" className="text-xs text-[#3678F6] hover:underline">
          Return to Workspace
        </Link>
      </div>
    );
  }

  const isCompleted = session.status === 'completed' || session.status === 'partially_completed';
  const isRunning = !isCompleted && session.status !== 'failed' && session.status !== 'cancelled';
  const totalBudget = session.depth === 'quick' ? 12 : session.depth === 'standard' ? 24 : 40;
  const remainingBudget = Math.max(0, totalBudget - (session.total_website_tasks || 0));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* =========================================================================
          REGION A: RESEARCH OVERVIEW & STATUS HEADER
          ========================================================================= */}
      <div className="rounded-2xl bg-gradient-to-r from-[#151C2B] via-[#101522] to-[#0A0D14] border border-white/[0.08] p-6 shadow-2xl space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/research"
              className="p-1.5 rounded-lg bg-[#101522] hover:bg-white/[0.06] text-[#8994A8] hover:text-[#F5F7FB] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-[#8994A8]">Session ID:</span>
              <span className="text-xs font-mono text-[#3678F6] font-semibold">{session.id}</span>
              <button
                onClick={handleCopySessionId}
                className="text-[#8994A8] hover:text-[#F5F7FB] transition-colors"
                title="Copy Session ID"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {copiedSessionId && (
                <span className="text-[10px] font-mono text-[#20B77A]">Copied!</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Status Pill */}
            <div
              className={`px-3 py-1 rounded-full border text-xs font-mono uppercase flex items-center gap-2 ${
                isCompleted
                  ? 'bg-[#20B77A]/10 text-[#20B77A] border-[#20B77A]/30'
                  : session.status === 'failed'
                  ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                  : session.status === 'cancelled'
                  ? 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30'
                  : 'bg-[#3678F6]/10 text-[#3678F6] border-[#3678F6]/30 animate-pulse'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCompleted
                    ? 'bg-[#20B77A]'
                    : session.status === 'failed'
                    ? 'bg-[#EF4444]'
                    : session.status === 'cancelled'
                    ? 'bg-neutral-500'
                    : 'bg-[#3678F6]'
                }`}
              />
              <span className="font-semibold">{session.status.replace('_', ' ')}</span>
            </div>

            {/* Elapsed Time Ticker */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101522] border border-white/[0.08] text-xs font-mono text-[#F5F7FB]">
              <Clock className="w-3.5 h-3.5 text-[#3678F6]" />
              <span>{formatDuration(elapsedSeconds)}</span>
            </div>

            {/* User Controls */}
            {isRunning && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-[#F5F7FB] transition-colors flex items-center gap-1.5"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 text-[#20B77A]" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{isPaused ? 'Resume Dispatch' : 'Pause Dispatch'}</span>
                </button>

                <button
                  onClick={handleCancelSwarm}
                  className="px-3 py-1 rounded-lg bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-xs font-semibold text-[#EF4444] transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Halt Swarm</span>
                </button>
              </div>
            )}

            {/* Direct Link to Full Workspace */}
            <Link
              href={`/research/${sessionId}`}
              className="px-3.5 py-1.5 rounded-lg bg-[#3678F6] hover:bg-[#3678F6]/90 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-[#3678F6]/20"
            >
              <span>{isCompleted ? 'View Audited Report & Graph' : 'Workspace View'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Research Question Banner */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#3678F6] font-semibold">
            Active Research Investigation
          </span>
          <h1 className="text-lg sm:text-2xl font-bold text-[#F5F7FB] leading-snug">
            {session.query}
          </h1>
        </div>

        {/* Real-Time State Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
          <div className="rounded-xl bg-[#101522] border border-white/[0.06] p-3 text-center">
            <span className="text-[10px] font-mono uppercase text-[#8994A8] block">Active Agents</span>
            <span className="text-xl font-bold font-mono text-[#3678F6]">
              {session.active_agents || 0}
            </span>
          </div>

          <div className="rounded-xl bg-[#101522] border border-white/[0.06] p-3 text-center">
            <span className="text-[10px] font-mono uppercase text-[#8994A8] block">Total Agents</span>
            <span className="text-xl font-bold font-mono text-[#F5F7FB]">
              {session.total_agents || agents.length}
            </span>
          </div>

          <div className="rounded-xl bg-[#101522] border border-white/[0.06] p-3 text-center">
            <span className="text-[10px] font-mono uppercase text-[#8994A8] block">Active Tasks</span>
            <span className="text-xl font-bold font-mono text-amber-400">
              {websiteTasks.filter((t) => t.status === 'running' || t.status === 'navigating').length}
            </span>
          </div>

          <div className="rounded-xl bg-[#101522] border border-white/[0.06] p-3 text-center">
            <span className="text-[10px] font-mono uppercase text-[#8994A8] block">Tasks Succeeded</span>
            <span className="text-xl font-bold font-mono text-[#20B77A]">
              {session.completed_website_tasks || websiteTasks.filter((t) => t.status === 'succeeded').length}
            </span>
          </div>

          <div className="rounded-xl bg-[#101522] border border-white/[0.06] p-3 text-center">
            <span className="text-[10px] font-mono uppercase text-[#8994A8] block">Tasks Failed</span>
            <span className="text-xl font-bold font-mono text-[#EF4444]">
              {session.failed_website_tasks || websiteTasks.filter((t) => t.status === 'failed').length}
            </span>
          </div>

          <div className="rounded-xl bg-[#101522] border border-white/[0.06] p-3 text-center">
            <span className="text-[10px] font-mono uppercase text-[#8994A8] block">Sources Found</span>
            <span className="text-xl font-bold font-mono text-[#F5F7FB]">
              {session.sources_discovered || 0}
            </span>
          </div>

          <div className="rounded-xl bg-[#101522] border border-white/[0.06] p-3 text-center">
            <span className="text-[10px] font-mono uppercase text-[#8994A8] block">Claims Extracted</span>
            <span className="text-xl font-bold font-mono text-[#20B77A]">
              {session.claims_extracted || claims.length}
            </span>
          </div>

          <div className="rounded-xl bg-[#101522] border border-white/[0.06] p-3 text-center">
            <span className="text-[10px] font-mono uppercase text-[#8994A8] block">Remaining Budget</span>
            <span className="text-xl font-bold font-mono text-[#8994A8]">
              {remainingBudget}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          COMPLETION EXPERIENCE BANNER (When Terminal State Reached)
          ========================================================================= */}
      {isCompleted && (
        <div className="rounded-2xl bg-gradient-to-r from-[#20B77A]/15 to-[#151C2B] border border-[#20B77A]/30 p-6 space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#20B77A]/20 text-[#20B77A]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F7FB]">
                  Research Swarm Completed Successfully
                </h3>
                <p className="text-xs text-[#8994A8]">
                  Investigation duration: {formatDuration(elapsedSeconds)} • Sufficiency: <span className="text-[#20B77A] font-semibold">Sufficient</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/research/${sessionId}`}
                className="px-4 py-2 rounded-xl bg-[#20B77A] hover:bg-[#20B77A]/90 text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-lg"
              >
                <FileText className="w-4 h-4" />
                <span>Open Audited Final Report</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SPLIT WORKSTATION: REGION B (AGENTS) & REGION C (ACTIVITY STREAM)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* REGION B: LIVE AGENT MONITOR (LEFT 7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F5F7FB] flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#3678F6]" />
              <span>Live Agent Swarm Monitor ({agents.length} Deployed)</span>
            </h3>
            <span className="text-[11px] font-mono text-[#8994A8]">
              {agents.filter((a) => a.status === 'running').length} currently active
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {agents.map((agent) => {
              const agentObjective = objectives.find((o) => o.id === agent.objective_id);
              const agentTasks = websiteTasks.filter((t) => t.agent_id === agent.id);
              const activeTask = agentTasks.find((t) => t.status === 'running' || t.status === 'navigating');

              return (
                <div
                  key={agent.id}
                  className="rounded-xl bg-[#151C2B] border border-white/[0.08] p-4 space-y-3 transition-all hover:border-white/[0.15]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#F5F7FB]">{agent.name}</span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.2 rounded bg-white/[0.04] text-[#3678F6] border border-white/[0.06]">
                          {agent.specialization}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8994A8] line-clamp-1">
                        Objective: {agentObjective?.title || agent.description}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold border ${
                        agent.status === 'completed'
                          ? 'bg-[#20B77A]/15 text-[#20B77A] border-[#20B77A]/30'
                          : agent.status === 'failed'
                          ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                          : 'bg-[#3678F6]/15 text-[#3678F6] border-[#3678F6]/30 animate-pulse'
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>

                  {/* Active Website / Current Action */}
                  <div className="rounded-lg bg-[#101522] border border-white/[0.06] p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8994A8]">
                      <span>CURRENT ACTIVITY:</span>
                      {activeTask && (
                        <span className="text-[#3678F6] truncate max-w-[200px]">
                          Target: {activeTask.url}
                        </span>
                      )}
                    </div>
                    <p className="text-[#F5F7FB] text-[11px] leading-relaxed">
                      {agent.current_action || (agent.status === 'completed' ? 'Completed objective evaluation' : 'Investigating primary sources')}
                    </p>
                  </div>

                  {/* Sub-Tasks & Discovery Counts */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono text-[#8994A8]">
                    <div className="flex items-center gap-3">
                      <span>Tasks: <strong>{agentTasks.length}</strong></span>
                      <span className="text-[#20B77A]">✓ {agent.websites_succeeded || agentTasks.filter(t => t.status === 'succeeded').length}</span>
                      <span className="text-[#EF4444]">✗ {agent.websites_failed || agentTasks.filter(t => t.status === 'failed').length}</span>
                    </div>

                    <span className="text-[#3678F6]">
                      Evidence Extracted: <strong>{agent.claims_extracted || 0} claims</strong>
                    </span>
                  </div>
                </div>
              );
            })}

            {agents.length === 0 && (
              <div className="rounded-xl bg-[#151C2B] border border-white/[0.08] p-12 text-center text-xs text-[#8994A8]">
                Research Compiler is formulating hypotheses and dispatching specialized agents...
              </div>
            )}
          </div>
        </div>

        {/* REGION C: LIVE ACTIVITY STREAM (RIGHT 5 COLS) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col h-[750px]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F5F7FB] flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#20B77A] animate-pulse" />
              <span>Real-Time Activity Stream</span>
            </h3>
            <span className="text-[10px] font-mono text-[#8994A8]">
              {filteredEvents.length} events logged
            </span>
          </div>

          {/* Activity Filters & Search Bar */}
          <div className="space-y-2 bg-[#151C2B] border border-white/[0.06] rounded-xl p-2.5">
            <div className="flex items-center gap-2 bg-[#101522] rounded-lg px-2.5 py-1 text-xs text-[#8994A8]">
              <Search className="w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search event messages, URLs..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="w-full bg-transparent text-[#F5F7FB] placeholder-[#5A6478] focus:outline-none text-[11px]"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono uppercase">
              {['all', 'compiler', 'agents', 'websites', 'evidence', 'errors'].map((category) => (
                <button
                  key={category}
                  onClick={() => setEventFilter(category)}
                  className={`px-2 py-0.5 rounded-md transition-colors shrink-0 ${
                    eventFilter === category
                      ? 'bg-[#3678F6] text-white font-semibold'
                      : 'bg-white/[0.04] text-[#8994A8] hover:text-[#F5F7FB]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Stream Feed */}
          <div className="flex-1 overflow-y-auto space-y-2.5 rounded-xl bg-[#101522] border border-white/[0.08] p-3 text-xs">
            {filteredEvents.map((evt, idx) => {
              const isExpanded = expandedEventId === evt.id;

              return (
                <div
                  key={evt.id}
                  className="rounded-lg bg-[#151C2B] border border-white/[0.06] p-2.5 space-y-1.5 transition-all hover:border-white/[0.12]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-[#3678F6] font-semibold">
                        #{evt.sequence_number || idx + 1}
                      </span>
                      <span className="text-[10px] font-mono text-[#5A6478]">
                        {new Date(evt.created_at).toLocaleTimeString()}
                      </span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/[0.04] text-[#8994A8]">
                        {evt.event_type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyEvent(evt)}
                        className="text-[#5A6478] hover:text-[#F5F7FB] p-0.5 transition-colors"
                        title="Copy Event JSON"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                        className="text-[#5A6478] hover:text-[#F5F7FB] p-0.5 transition-colors"
                        title="Toggle Metadata"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[#F5F7FB]/95 text-[11px] leading-relaxed">
                    {evt.message}
                  </p>

                  {/* Expandable JSON Metadata */}
                  {isExpanded && evt.structured_metadata && (
                    <div className="pt-2 border-t border-white/[0.06]">
                      <pre className="text-[9px] font-mono text-[#8994A8] bg-[#0A0D14] p-2 rounded overflow-x-auto">
                        {JSON.stringify(evt.structured_metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredEvents.length === 0 && (
              <div className="py-20 text-center text-xs text-[#8994A8]">
                Awaiting real-time backend stream events...
              </div>
            )}
            <div ref={eventStreamEndRef} />
          </div>
        </div>
      </div>

      {/* =========================================================================
          REGION D: LIVE WEBSITE ACTIVITY INSPECTOR
          ========================================================================= */}
      <div className="rounded-2xl bg-[#151C2B] border border-white/[0.08] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#F5F7FB] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#3678F6]" />
              <span>Live Website Activity Inspector ({websiteTasks.length} Tasks)</span>
            </h3>
            <p className="text-xs text-[#8994A8]">
              Independent website tasks executed concurrently with timeout guards and fault isolation.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] font-mono uppercase text-[#8994A8]">
                <th className="py-2.5 px-3">Target Domain & URL</th>
                <th className="py-2.5 px-3">Agent</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Retries</th>
                <th className="py-2.5 px-3">Result / Diagnostic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {websiteTasks.map((task) => {
                const assignedAgent = agents.find((a) => a.id === task.agent_id);
                let domain = 'external';
                try {
                  domain = new URL(task.url).hostname;
                } catch {
                  domain = task.url.slice(0, 25);
                }

                const statusColor =
                  task.status === 'succeeded'
                    ? 'bg-[#20B77A]/15 text-[#20B77A] border-[#20B77A]/30'
                    : task.status === 'failed' || task.status === 'timed_out'
                    ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                    : 'bg-[#3678F6]/15 text-[#3678F6] border-[#3678F6]/30 animate-pulse';

                return (
                  <tr key={task.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-[#F5F7FB]">{domain}</span>
                        <a
                          href={task.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-mono text-[#3678F6] truncate max-w-[280px] block hover:underline"
                        >
                          {task.url}
                        </a>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-[#8994A8]">
                      {assignedAgent?.name || 'Research Agent'}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${statusColor}`}>
                        {task.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-[#8994A8]">
                      {task.execution_duration_ms ? `${(task.execution_duration_ms / 1000).toFixed(1)}s` : '—'}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-[#8994A8]">
                      {task.retry_count}/{task.max_retries}
                    </td>

                    <td className="py-3 px-3 text-[11px]">
                      {task.status === 'succeeded' ? (
                        <span className="text-[#20B77A]">Verified content retrieved</span>
                      ) : task.error_message ? (
                        <div className="space-y-0.5">
                          <span className="text-[#EF4444] font-semibold">{task.error_message}</span>
                          <span className="text-[10px] text-[#8994A8] block">Action: Moving to next independent source</span>
                        </div>
                      ) : (
                        <span className="text-[#8994A8]">Processing document...</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {websiteTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#8994A8]">
                    No website tasks dispatched yet. Agents are formulating search queries...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          REGION E: LIVE EVIDENCE DISCOVERY
          ========================================================================= */}
      <div className="rounded-2xl bg-[#151C2B] border border-white/[0.08] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#F5F7FB] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#20B77A]" />
              <span>Live Evidence Discovery Feed ({claims.length} Claims Cataloged)</span>
            </h3>
            <p className="text-xs text-[#8994A8]">
              Claims extracted from primary web passages. Click any card to inspect cryptographic hash and verbatim quote.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {claims.map((claim) => {
            const discoveringAgent = agents.find((a) => a.id === claim.agent_id);

            return (
              <div
                key={claim.id}
                onClick={() =>
                  setSelectedEvidenceNode({
                    id: claim.id,
                    label: claim.claim_text,
                    nodeType: 'evidence',
                    claimText: claim.claim_text,
                    originalPassage: claim.original_passage,
                    stance: claim.stance,
                    confidence: claim.confidence,
                    confidenceRationale: claim.confidence_rationale,
                    retrievedAt: claim.created_at,
                    verificationStatus: claim.verification_status,
                  })
                }
                className="cursor-pointer rounded-xl bg-[#101522] border border-white/[0.06] p-4 space-y-3 transition-all hover:border-[#3678F6]/40 hover:bg-[#101522]/90"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${
                      claim.stance === 'contradicts'
                        ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                        : claim.stance === 'neutral'
                        ? 'bg-amber-400/15 text-amber-400 border-amber-400/30'
                        : 'bg-[#20B77A]/15 text-[#20B77A] border-[#20B77A]/30'
                    }`}
                  >
                    {claim.stance}
                  </span>

                  <span className="text-[10px] font-mono text-[#8994A8] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#20B77A]" />
                    {Math.round((claim.confidence || 0.85) * 100)}%
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-[#F5F7FB] line-clamp-3 leading-snug">
                  {claim.claim_text}
                </h4>

                <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-[#8994A8]">
                  <span>{discoveringAgent?.name || 'Specialized Agent'}</span>
                  <span className="text-[#3678F6]">Inspect Provenance →</span>
                </div>
              </div>
            );
          })}

          {claims.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-[#8994A8]">
              Evidence extraction stream awaiting first verified source passage...
            </div>
          )}
        </div>
      </div>

      {/* Provenance Detail Drawer */}
      <EvidenceDetailDrawer
        data={selectedEvidenceNode}
        onClose={() => setSelectedEvidenceNode(null)}
      />
    </div>
  );
}

