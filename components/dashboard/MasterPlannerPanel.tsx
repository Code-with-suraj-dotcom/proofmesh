import React from 'react';
import { Target, Layers, ArrowRight, ShieldCheck, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { ResearchObjective } from '@/types/agents';
import { ResearchSession } from '@/types/research';

interface Props {
  session: ResearchSession;
  objectives: ResearchObjective[];
}

export function MasterPlannerPanel({ session, objectives }: Props) {
  const metadata = session.metadata || {};

  return (
    <div className="rounded-2xl bg-[#101522] border border-white/[0.08] p-5 shadow-xl text-left space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#3678F6]/15 border border-[#3678F6]/30 flex items-center justify-center text-[#3678F6]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#F5F7FB]">
              Master Planner Agent Architecture
            </h3>
            <p className="text-xs text-[#8994A8]">
              Decomposed into {objectives.length} dynamic research objectives with dependency scheduling
            </p>
          </div>
        </div>

        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#3678F6]/10 text-[#3678F6] border border-[#3678F6]/20">
          Level 1 Orchestration
        </span>
      </div>

      {/* Semantic Metadata Bar */}
      {(metadata.geography || metadata.timeframe || (metadata.entities && metadata.entities.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-[#080B12]/60 rounded-xl p-3 border border-white/[0.04] text-xs">
          {metadata.geography && (
            <div className="flex items-center gap-2 text-[#8994A8]">
              <MapPin className="w-3.5 h-3.5 text-[#3678F6] flex-shrink-0" />
              <span className="truncate">Scope: <strong className="text-[#F5F7FB]">{metadata.geography}</strong></span>
            </div>
          )}
          {metadata.timeframe && (
            <div className="flex items-center gap-2 text-[#8994A8]">
              <Calendar className="w-3.5 h-3.5 text-[#20B77A] flex-shrink-0" />
              <span className="truncate">Horizon: <strong className="text-[#F5F7FB]">{metadata.timeframe}</strong></span>
            </div>
          )}
          {metadata.entities && metadata.entities.length > 0 && (
            <div className="flex items-center gap-2 text-[#8994A8]">
              <Target className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <span className="truncate">Entities: <strong className="text-[#F5F7FB]">{metadata.entities.slice(0, 3).join(', ')}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Objectives List & Dependencies */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#8994A8] block">
          Formulated Research Objectives:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {objectives.map((obj, idx) => {
            const isCompleted = obj.status === 'completed';
            const isRunning = obj.status === 'running';

            return (
              <div
                key={obj.id}
                className="rounded-xl bg-[#151C2B] border border-white/[0.06] hover:border-white/[0.15] p-3.5 space-y-2 transition-all text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-white/[0.06] font-mono text-[10px] text-[#8994A8] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-[#F5F7FB] truncate">
                      {obj.title}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                      isCompleted
                        ? 'bg-[#20B77A]/15 text-[#20B77A] border-[#20B77A]/30'
                        : isRunning
                        ? 'bg-[#3678F6]/15 text-[#3678F6] border-[#3678F6]/30 animate-pulse'
                        : 'bg-white/[0.05] text-[#8994A8] border-white/[0.1]'
                    }`}
                  >
                    {obj.status}
                  </span>
                </div>

                <p className="text-[11px] text-[#8994A8] line-clamp-2 leading-relaxed">
                  {obj.description}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#5A6478] pt-1 border-t border-white/[0.04]">
                  <span className="text-[#3678F6]">Spec: {obj.specialization}</span>
                  {obj.dependencies && obj.dependencies.length > 0 ? (
                    <span className="text-amber-400">Depends on: {obj.dependencies.join(', ')}</span>
                  ) : (
                    <span className="text-[#20B77A]">Independent Task</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

