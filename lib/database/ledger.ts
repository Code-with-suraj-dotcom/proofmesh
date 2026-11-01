import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface ChainOfCustodyStep {
  timestamp: string;
  action: 'extracted' | 'validated' | 'challenged' | 'corroborated' | 'cross_examined';
  actor: string;
  details: string;
}

export interface ProvenanceLedgerEntry {
  ledger_id: string;
  research_id: string;
  claim_id: string;
  claim_text: string;
  verbatim_passage: string;
  passage_sha256: string;
  source_id: string;
  source_title: string;
  source_url: string;
  source_domain: string;
  retrieved_at: string;
  agent_id: string;
  agent_specialization: string;
  search_query_used?: string;
  confidence: number;
  confidence_breakdown: {
    empirical_specificity: number; // 0-1
    source_authority: number; // 0-1
    passage_directness: number; // 0-1
    rationale: string;
  };
  verification_status: 'verified' | 'disputed' | 'falsified' | 'under_review';
  chain_of_custody: ChainOfCustodyStep[];
}

const LEDGER_DIR = path.join(process.cwd(), '.data', 'ledger');

class EvidenceLedgerService {
  constructor() {
    if (!fs.existsSync(LEDGER_DIR)) {
      fs.mkdirSync(LEDGER_DIR, { recursive: true });
    }
  }

  private getSessionLedgerFile(researchId: string): string {
    return path.join(LEDGER_DIR, `${researchId}.ledger.json`);
  }

  private calculateHash(text: string): string {
    return crypto.createHash('sha256').update(text.trim()).digest('hex');
  }

  async recordEntry(entry: Omit<ProvenanceLedgerEntry, 'ledger_id' | 'passage_sha256' | 'chain_of_custody'>): Promise<ProvenanceLedgerEntry> {
    const filePath = this.getSessionLedgerFile(entry.research_id);
    let entries: ProvenanceLedgerEntry[] = [];

    try {
      if (fs.existsSync(filePath)) {
        entries = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    } catch (err) {
      console.warn('[Ledger] Failed to load ledger file:', err);
    }

    const passageHash = this.calculateHash(entry.verbatim_passage);
    const fullEntry: ProvenanceLedgerEntry = {
      ...entry,
      ledger_id: crypto.randomUUID(),
      passage_sha256: passageHash,
      chain_of_custody: [
        {
          timestamp: new Date().toISOString(),
          action: 'extracted',
          actor: `${entry.agent_specialization} agent`,
          details: `Extracted verbatim excerpt from ${entry.source_domain} via query: "${entry.search_query_used || 'domain search'}".`,
        },
      ],
    };

    entries.push(fullEntry);

    try {
      fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Ledger] Failed to persist entry:', err);
    }

    return fullEntry;
  }

  async appendCustodyStep(
    researchId: string,
    claimId: string,
    action: ChainOfCustodyStep['action'],
    actor: string,
    details: string
  ): Promise<void> {
    const filePath = this.getSessionLedgerFile(researchId);
    if (!fs.existsSync(filePath)) return;

    try {
      const entries: ProvenanceLedgerEntry[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const idx = entries.findIndex((e) => e.claim_id === claimId);
      if (idx !== -1) {
        entries[idx].chain_of_custody.push({
          timestamp: new Date().toISOString(),
          action,
          actor,
          details,
        });
        fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf-8');
      }
    } catch (err) {
      console.error('[Ledger] Failed to append custody step:', err);
    }
  }

  async getLedgerEntries(researchId: string): Promise<ProvenanceLedgerEntry[]> {
    const filePath = this.getSessionLedgerFile(researchId);
    if (!fs.existsSync(filePath)) return [];

    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (err) {
      console.error('[Ledger] Failed to read ledger:', err);
      return [];
    }
  }

  async verifyPassageCryptographicHash(researchId: string, claimId: string): Promise<{ valid: boolean; hash: string }> {
    const entries = await this.getLedgerEntries(researchId);
    const entry = entries.find((e) => e.claim_id === claimId);
    if (!entry) return { valid: false, hash: '' };

    const recomputed = this.calculateHash(entry.verbatim_passage);
    return {
      valid: recomputed === entry.passage_sha256,
      hash: recomputed,
    };
  }
}

export const evidenceLedger = new EvidenceLedgerService();

