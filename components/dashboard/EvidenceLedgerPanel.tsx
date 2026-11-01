'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Lock,
  History,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { ProvenanceLedgerEntry, ChainOfCustodyStep } from '@/database/ledger';

interface Props {
  sessionId: string;
}

export function EvidenceLedgerPanel({ sessionId }: Props) {
  const [entries, setEntries] = useState<ProvenanceLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingClaimId, setVerifyingClaimId] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/research/${sessionId}/ledger`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [sessionId]);

  const verifyHash = async (claimId: string) => {
    try {
      setVerifyingClaimId(claimId);
      const res = await fetch(`/api/research/${sessionId}/ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_id: claimId }),
      });
      if (res.ok) {
        const result = await res.json();
        setVerificationResults((prev) => ({
          ...prev,
          [claimId]: result.valid,
        }));
      }
    } catch (err) {
      console.error('Failed to verify hash:', err);
    } finally {
      setVerifyingClaimId(null);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesFilter = filterStatus === 'all' || entry.verification_status === filterStatus;
    const matchesSearch =
      searchQuery === '' ||
      entry.claim_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.source_domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.passage_sha256.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading && entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-7 h-7 rounded-full border-2 border-[#3678F6]/20 border-t-[#3678F6] animate-spin"></div>
        <p className="text-xs font-mono text-[#8994A8]">
          Auditing Cryptographic Evidence Ledger...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#151C2B] to-[#101522] border border-white/[0.08] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#20B77A]/10 text-[#20B77A] border border-[#20B77A]/30">
                <Lock className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#F5F7FB]">
                Cryptographic Evidence Provenance Ledger
              </h2>
            </div>
            <p className="text-xs text-[#8994A8] max-w-2xl leading-relaxed">
              Every empirical claim is anchored to an exact SHA-256 cryptographic passage hash,
              domain attribution metadata, and an immutable chain-of-custody audit trail.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-[#8994A8] block">
                Audited Claims
              </span>
              <span className="text-xl font-bold font-mono text-[#F5F7FB]">
                {entries.length}
              </span>
            </div>
            <div className="h-8 w-px bg-white/[0.08]" />
            <button
              onClick={fetchLedger}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#8994A8] hover:text-[#F5F7FB] border border-white/[0.08] transition-colors"
              title="Refresh Ledger"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#101522] border border-white/[0.06] rounded-xl p-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#8994A8]" />
          <input
            type="text"
            placeholder="Search claim, domain, or SHA-256 hash prefix..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-[#F5F7FB] placeholder-[#5A6478] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#8994A8]">Status:</span>
          {['all', 'verified', 'disputed', 'falsified'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase transition-colors ${
                filterStatus === st
                  ? 'bg-[#3678F6] text-white font-semibold'
                  : 'bg-white/[0.04] text-[#8994A8] hover:text-[#F5F7FB]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table / Cards */}
      <div className="space-y-3">
        {filteredEntries.map((entry) => {
          const isExpanded = expandedId === entry.claim_id;
          const isVerifying = verifyingClaimId === entry.claim_id;
          const verifiedStatus = verificationResults[entry.claim_id];

          return (
            <div
              key={entry.ledger_id}
              className="rounded-xl bg-[#151C2B] border border-white/[0.08] overflow-hidden transition-all hover:border-white/[0.15]"
            >
              <div className="p-4 space-y-3">
                {/* Header Row: Domain, Agent, Confidence, and Verify Button */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#F5F7FB] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3678F6]"></span>
                      {entry.source_domain}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-[#8994A8] border border-white/[0.06]">
                      {entry.agent_specialization}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                        entry.verification_status === 'verified'
                          ? 'bg-[#20B77A]/10 text-[#20B77A] border border-[#20B77A]/30'
                          : entry.verification_status === 'falsified'
                          ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30'
                          : 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                      }`}
                    >
                      {entry.verification_status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Live Cryptographic Verification Badge */}
                    {verifiedStatus === true ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#20B77A]/15 text-[#20B77A] border border-[#20B77A]/40 text-[11px] font-mono font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>SHA-256 Validated</span>
                      </span>
                    ) : verifiedStatus === false ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/40 text-[11px] font-mono font-semibold">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Hash Mismatch</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => verifyHash(entry.claim_id)}
                        disabled={isVerifying}
                        className="px-2.5 py-1 rounded-md bg-[#3678F6]/10 hover:bg-[#3678F6]/20 text-[#3678F6] border border-[#3678F6]/30 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isVerifying ? (
                          <div className="w-3 h-3 rounded-full border border-[#3678F6]/30 border-t-[#3678F6] animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        <span>Verify Hash</span>
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entry.claim_id)}
                      className="p-1 rounded text-[#8994A8] hover:text-[#F5F7FB] transition-colors"
                      title="Toggle Details & Custody"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Claim Statement */}
                <h4 className="text-sm font-semibold text-[#F5F7FB] leading-snug">
                  {entry.claim_text}
                </h4>

                {/* SHA-256 Fingerprint Pill */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="flex items-center gap-1.5 bg-[#101522] border border-white/[0.06] rounded-md px-2.5 py-1 text-[11px] font-mono text-[#8994A8]">
                    <span className="text-[#3678F6] font-semibold">SHA-256:</span>
                    <span className="text-[#F5F7FB] select-all">
                      {entry.passage_sha256}
                    </span>
                    <button
                      onClick={() => handleCopyHash(entry.passage_sha256)}
                      className="ml-1 text-[#5A6478] hover:text-[#F5F7FB] transition-colors"
                      title="Copy Hash"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {copiedHash === entry.passage_sha256 && (
                      <span className="text-[10px] text-[#20B77A]">Copied!</span>
                    )}
                  </div>

                  <a
                    href={entry.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-[#3678F6] hover:underline"
                  >
                    <span>{entry.source_title.slice(0, 35)}...</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Expanded Details: Verbatim Passage & Chain of Custody */}
                {isExpanded && (
                  <div className="pt-3 border-t border-white/[0.06] space-y-4">
                    {/* Verbatim Excerpt */}
                    <div className="rounded-lg bg-[#101522] border border-white/[0.06] p-3 space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#3678F6] block">
                        Verbatim Source Excerpt (Zero-Fabrication Anchor)
                      </span>
                      <blockquote className="text-xs italic text-[#F5F7FB] border-l-2 border-[#3678F6] pl-3 py-0.5 leading-relaxed">
                        &ldquo;{entry.verbatim_passage}&rdquo;
                      </blockquote>
                    </div>

                    {/* Chain of Custody Audit Trail */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-[#8994A8]">
                        <History className="w-3.5 h-3.5 text-[#3678F6]" />
                        <span>Chain of Custody Timeline ({entry.chain_of_custody?.length || 1} steps)</span>
                      </div>

                      <div className="space-y-1.5 pl-2 border-l border-white/[0.08]">
                        {(entry.chain_of_custody || []).map((step: ChainOfCustodyStep, idx: number) => (
                          <div key={idx} className="relative pl-3 text-xs space-y-0.5">
                            <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-[#3678F6]"></span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] uppercase font-semibold text-[#3678F6]">
                                [{step.action}]
                              </span>
                              <span className="text-[#8994A8] text-[10px] font-mono">
                                by {step.actor}
                              </span>
                              <span className="text-[#5A6478] text-[10px] font-mono">
                                {new Date(step.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-[#F5F7FB]/90 text-[11px] leading-relaxed">
                              {step.details}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredEntries.length === 0 && (
          <div className="rounded-xl bg-[#151C2B] border border-white/[0.08] p-12 text-center text-xs text-[#8994A8]">
            No cryptographic ledger entries match current filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}

