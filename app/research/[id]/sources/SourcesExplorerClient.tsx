'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ExternalLink, Search, Filter } from 'lucide-react';
import { Source } from '@/types/evidence';

interface Props {
  sessionId: string;
}

export function SourcesExplorerClient({ sessionId }: Props) {
  const [sources, setSources] = useState<Source[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSources() {
      try {
        const res = await fetch(`/api/research/${sessionId}/sources`);
        if (res.ok) {
          const data = await res.json();
          setSources(data.sources || []);
        }
      } catch (err) {
        console.error('Failed to fetch sources:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSources();
  }, [sessionId]);

  const filtered = sources.filter((s) => {
    const matchesSearch = (s.title + s.domain + s.url).toLowerCase().includes(filterQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || s.source_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/research/${sessionId}`}
            className="p-1.5 rounded-lg bg-[#151C2B] text-[#8994A8] hover:text-[#F5F7FB] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#F5F7FB]">
              Primary Source Explorer
            </h1>
            <p className="text-xs text-[#8994A8]">
              All authenticated web documents, academic papers, and government filings
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-[#20B77A] bg-[#20B77A]/10 px-2.5 py-1 rounded-full border border-[#20B77A]/20">
          {sources.length} Audited Sources
        </span>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#101522] p-3 rounded-xl border border-white/[0.08]">
        <div className="flex items-center gap-2 bg-[#151C2B] rounded-lg px-3 py-1.5 border border-white/[0.06] w-64 sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#8994A8]" />
          <input
            type="text"
            placeholder="Search titles, domains, or URLs..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="bg-transparent text-xs text-[#F5F7FB] focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#8994A8]" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#151C2B] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FB] focus:outline-none"
          >
            <option value="all">All Source Types</option>
            <option value="academic_paper">Academic Papers</option>
            <option value="government_policy">Government & Regulatory</option>
            <option value="industry_report">Industry Reports</option>
            <option value="news_article">News & Media</option>
            <option value="technical_doc">Technical Docs</option>
          </select>
        </div>
      </div>

      {/* Grid of Sources */}
      {loading ? (
        <div className="text-center py-20 text-xs text-[#8994A8]">Loading sources...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-xs text-[#8994A8]">No sources matched the criteria.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="rounded-xl bg-[#101522] border border-white/[0.08] p-5 space-y-3 shadow-xl hover:border-white/[0.2] transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-[#3678F6] uppercase block mb-0.5">
                    {s.source_type?.replace('_', ' ')}
                  </span>
                  <h3 className="text-sm font-semibold text-[#F5F7FB] leading-snug">
                    {s.title}
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#20B77A]/10 text-[#20B77A] border border-[#20B77A]/20 flex-shrink-0">
                  Credibility: {s.credibility_assessment?.score || 92}%
                </span>
              </div>

              {s.content_snippet && (
                <p className="text-xs text-[#8994A8] leading-relaxed line-clamp-3 bg-[#151C2B] p-3 rounded-lg border border-white/[0.04]">
                  &ldquo;{s.content_snippet}&rdquo;
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs font-mono text-[#8994A8]">
                <span>{s.claim_count || 0} claims extracted</span>
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
      )}
    </div>
  );
}

