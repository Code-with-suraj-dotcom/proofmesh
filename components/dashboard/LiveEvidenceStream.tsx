'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Terminal, ShieldCheck, Flame, Globe, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';
import { ResearchEvent } from '@/types/research';

interface Props {
  sessionId: string;
}

export function LiveEvidenceStream({ sessionId }: Props) {
  const [events, setEvents] = useState<ResearchEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(`/api/research/${sessionId}/stream`);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.id) {
            setEvents((prev) => {
              // Avoid duplicates
              if (prev.some((e) => e.id === parsed.id)) return prev;
              return [...prev, parsed];
            });
          }
        } catch {
          // ignore heartbeat / comments
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.error('[LiveEvidenceStream] SSE setup error:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'objective_created':
        return <Sparkles className="w-3.5 h-3.5 text-[#3678F6] flex-shrink-0" />;
      case 'agent_started':
      case 'agent_dispatched':
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />;
      case 'website_task_succeeded':
        return <Globe className="w-3.5 h-3.5 text-[#20B77A] flex-shrink-0" />;
      case 'evidence_extracted':
      case 'claim_validated':
        return <ShieldCheck className="w-3.5 h-3.5 text-[#20B77A] flex-shrink-0" />;
      case 'contradiction_detected':
        return <Flame className="w-3.5 h-3.5 text-[#EF4444] flex-shrink-0" />;
      case 'verification_requested':
        return <AlertCircle className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-[#8994A8] flex-shrink-0" />;
    }
  };

  return (
    <div className="rounded-2xl bg-[#080B12] border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col text-left h-[420px]">
      {/* Header */}
      <div className="bg-[#101522] px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#3678F6]" />
          <span className="text-xs font-semibold text-[#F5F7FB]">
            Live Evidence Stream & Forensic Audit Trail
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-[#20B77A] animate-pulse' : 'bg-[#EF4444]'
            }`}
          ></span>
          <span className="text-[10px] font-mono text-[#8994A8]">
            {isConnected ? 'Real-Time SSE Connected' : 'Connecting Stream...'}
          </span>
        </div>
      </div>

      {/* Terminal Scroll Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
        {events.length === 0 ? (
          <div className="text-center py-16 text-[#5A6478]">
            <p>Initializing autonomous research stream...</p>
          </div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              className="flex items-start gap-2.5 p-1.5 rounded hover:bg-white/[0.02] transition-colors"
            >
              <div className="mt-0.5">{getEventIcon(evt.event_type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#5A6478]">
                    {new Date(evt.created_at).toLocaleTimeString()}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[#3678F6] font-bold">
                    [{evt.event_type.replace('_', ' ')}]
                  </span>
                </div>
                <p className="text-xs text-[#F5F7FB] leading-snug break-words mt-0.5">
                  {evt.message}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

