'use client';

import React, { useState } from 'react';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';
import { ResearchAgentTask, WebsiteTask } from '@/types/agents';

interface Props {
  agents: ResearchAgentTask[];
}

export function AgentGrid({ agents }: Props) {
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);

  const toggleAgent = (id: string) => {
    setExpandedAgentId(expandedAgentId === id ? null : id);
  };

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#3678F6]" />
          <h3 className="text-sm font-semibold text-[#F5F7FB]">
            Autonomous Research Agent Swarm ({agents.length} Agents)
          </h3>
        </div>
        <span className="text-[10px] text-[#8994A8] font-mono">
          Click an agent card to inspect individual website tasks
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {agents.map((agent) => {
          const isExpanded = expandedAgentId === agent.id;
          const isCompleted = agent.status === 'completed';
          const isPartial = agent.status === 'partially_completed';
          const isFailed = agent.status === 'failed';
          const isRunning = agent.status === 'running';

          const statusColor = isCompleted
            ? 'text-[#20B77A] bg-[#20B77A]/10 border-[#20B77A]/30'
            : isPartial
            ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
            : isFailed
            ? 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30'
            : isRunning
            ? 'text-[#3678F6] bg-[#3678F6]/10 border-[#3678F6]/30 animate-pulse'
            : 'text-[#8994A8] bg-white/[0.05] border-white/[0.1]';

          return (
            <div
              key={agent.id}
              className={`rounded-xl bg-[#101522] border ${
                isExpanded ? 'border-[#3678F6]' : 'border-white/[0.08]'
              } p-4 shadow-lg hover:border-white/[0.2] transition-all flex flex-col justify-between`}
            >
              <div>
                {/* Agent Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#3678F6] block mb-0.5">
                      {agent.specialization} Swarm
                    </span>
                    <h4 className="text-xs font-semibold text-[#F5F7FB] leading-snug">
                      {agent.name}
                    </h4>
                  </div>
                  <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${statusColor}`}>
                    {agent.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-[11px] text-[#8994A8] line-clamp-2 leading-relaxed mb-3">
                  {agent.description}
                </p>
              </div>

              {/* Real-Time Metrics Counters */}
              <div className="border-t border-white/[0.06] pt-3 mt-1">
                <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                  <div className="bg-[#151C2B] rounded-lg p-1.5 border border-white/[0.04]">
                    <span className="text-[10px] text-[#8994A8] block">Sites</span>
                    <span className="text-xs font-bold text-[#F5F7FB]">{agent.websites_dispatched}</span>
                  </div>
                  <div className="bg-[#151C2B] rounded-lg p-1.5 border border-white/[0.04]">
                    <span className="text-[10px] text-[#20B77A] block">Pass</span>
                    <span className="text-xs font-bold text-[#20B77A]">{agent.websites_succeeded}</span>
                  </div>
                  <div className="bg-[#151C2B] rounded-lg p-1.5 border border-white/[0.04]">
                    <span className="text-[10px] text-[#EF4444] block">Fail</span>
                    <span className="text-xs font-bold text-[#EF4444]">{agent.websites_failed}</span>
                  </div>
                  <div className="bg-[#151C2B] rounded-lg p-1.5 border border-white/[0.04]">
                    <span className="text-[10px] text-[#3678F6] block">Claims</span>
                    <span className="text-xs font-bold text-[#3678F6]">{agent.claims_extracted}</span>
                  </div>
                </div>

                {/* Expand / Inspect Button */}
                <button
                  onClick={() => toggleAgent(agent.id)}
                  className="w-full mt-3 flex items-center justify-center gap-1 text-[11px] font-medium text-[#8994A8] hover:text-[#F5F7FB] transition-colors py-1 rounded bg-white/[0.02] hover:bg-white/[0.06]"
                >
                  <span>{isExpanded ? 'Hide Website Tasks' : 'Inspect Website Tasks'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expanded Website Task Inspector */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-2 animate-in fade-in duration-200">
                  <span className="text-[10px] font-mono uppercase text-[#8994A8] block">
                    Independent Website Tasks:
                  </span>
                  {(!agent.website_tasks || agent.website_tasks.length === 0) ? (
                    <p className="text-[11px] text-[#5A6478] italic">
                      No website tasks dispatched yet for this agent.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {agent.website_tasks.map((task: WebsiteTask) => {
                        const isTaskSuccess = task.status === 'succeeded';
                        const isTaskFailed = task.status === 'failed' || task.status === 'timed_out';

                        return (
                          <div
                            key={task.id}
                            className="rounded-lg bg-[#151C2B] border border-white/[0.04] p-2 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 truncate">
                                {isTaskSuccess ? (
                                  <CheckCircle className="w-3 h-3 text-[#20B77A] flex-shrink-0" />
                                ) : isTaskFailed ? (
                                  <XCircle className="w-3 h-3 text-[#EF4444] flex-shrink-0" />
                                ) : (
                                  <Clock className="w-3 h-3 text-[#3678F6] flex-shrink-0 animate-spin" />
                                )}
                                <span className="font-mono text-[10px] text-[#F5F7FB] truncate">
                                  {task.url}
                                </span>
                              </div>
                              <span
                                className={`text-[9px] font-mono px-1 rounded ${
                                  isTaskSuccess
                                    ? 'text-[#20B77A] bg-[#20B77A]/10'
                                    : isTaskFailed
                                    ? 'text-[#EF4444] bg-[#EF4444]/10'
                                    : 'text-[#3678F6] bg-[#3678F6]/10'
                                }`}
                              >
                                {task.status}
                              </span>
                            </div>

                            {task.execution_duration_ms && (
                              <div className="flex items-center justify-between text-[9px] text-[#5A6478] font-mono">
                                <span>Duration: {task.execution_duration_ms}ms</span>
                                <span>Retries: {task.retry_count}/{task.max_retries}</span>
                              </div>
                            )}

                            {task.error_message && (
                              <p className="text-[10px] text-[#EF4444] leading-tight bg-[#EF4444]/5 p-1 rounded">
                                Error ({task.error_type || 'network'}): {task.error_message}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

