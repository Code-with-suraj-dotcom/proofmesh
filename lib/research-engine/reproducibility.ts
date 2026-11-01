import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { repository } from '@/database/store';
import { Claim, Source, Contradiction } from '@/types/evidence';
import { GraphNode, GraphEdge } from '@/types/graph';
import { ResearchReport } from '@/types/research';

export interface ResearchSnapshot {
  snapshot_id: string;
  research_id: string;
  version: number;
  label: string;
  created_at: string;
  query: string;
  frozen_claims: Claim[];
  frozen_sources: Source[];
  frozen_contradictions: Contradiction[];
  frozen_report: ResearchReport | null;
  frozen_nodes: GraphNode[];
  frozen_edges: GraphEdge[];
  metrics: {
    total_sources: number;
    total_claims: number;
    total_contradictions: number;
    verified_percentage: number;
  };
}

export interface SnapshotComparison {
  snapshot_a_id: string;
  snapshot_b_id: string;
  version_a: number;
  version_b: number;
  new_claims_count: number;
  removed_claims_count: number;
  modified_claims_count: number;
  source_delta: number;
  contradiction_delta: number;
  conclusion_comparison: {
    version_a_summary: string;
    version_b_summary: string;
    delta_explanation: string;
  };
}

const SNAPSHOTS_DIR = path.join(process.cwd(), '.data', 'snapshots');

class ReproducibilityService {
  constructor() {
    if (!fs.existsSync(SNAPSHOTS_DIR)) {
      fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
    }
  }

  private getSessionDir(researchId: string): string {
    const dir = path.join(SNAPSHOTS_DIR, researchId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  async createSnapshot(researchId: string, label = 'Automated Execution Snapshot'): Promise<ResearchSnapshot> {
    const session = await repository.getSession(researchId);
    if (!session) throw new Error(`Research session ${researchId} not found`);

    const [sources, claims, contradictions, graph, report] = await Promise.all([
      repository.getSources(researchId),
      repository.getClaims(researchId),
      repository.getContradictions(researchId),
      repository.getEvidenceGraph(researchId),
      repository.getReport(researchId),
    ]);

    const sessionDir = this.getSessionDir(researchId);
    const existingFiles = fs.readdirSync(sessionDir).filter((f) => f.endsWith('.json'));
    const version = existingFiles.length + 1;

    const snapshotId = crypto.randomUUID();
    const snapshot: ResearchSnapshot = {
      snapshot_id: snapshotId,
      research_id: researchId,
      version,
      label: `${label} (v${version})`,
      created_at: new Date().toISOString(),
      query: session.query,
      frozen_claims: claims,
      frozen_sources: sources,
      frozen_contradictions: contradictions,
      frozen_report: report,
      frozen_nodes: graph.nodes,
      frozen_edges: graph.edges,
      metrics: {
        total_sources: sources.length,
        total_claims: claims.length,
        total_contradictions: contradictions.length,
        verified_percentage: claims.length > 0 ? Math.round((claims.filter((c) => c.verification_status === 'verified').length / claims.length) * 100) : 100,
      },
    };

    fs.writeFileSync(path.join(sessionDir, `v${version}_${snapshotId}.json`), JSON.stringify(snapshot, null, 2), 'utf-8');
    return snapshot;
  }

  async listSnapshots(researchId: string): Promise<ResearchSnapshot[]> {
    const sessionDir = this.getSessionDir(researchId);
    const files = fs.readdirSync(sessionDir).filter((f) => f.endsWith('.json'));
    const snapshots: ResearchSnapshot[] = [];

    for (const f of files) {
      try {
        const raw = fs.readFileSync(path.join(sessionDir, f), 'utf-8');
        snapshots.push(JSON.parse(raw));
      } catch (err) {
        console.warn('[Reproducibility] Failed to parse snapshot file:', f, err);
      }
    }

    return snapshots.sort((a, b) => a.version - b.version);
  }

  async compareSnapshots(researchId: string, versionA: number, versionB: number): Promise<SnapshotComparison> {
    const snapshots = await this.listSnapshots(researchId);
    const snapA = snapshots.find((s) => s.version === versionA);
    const snapB = snapshots.find((s) => s.version === versionB);

    if (!snapA || !snapB) {
      throw new Error(`One or both snapshot versions (v${versionA}, v${versionB}) not found`);
    }

    const claimMapA = new Map(snapA.frozen_claims.map((c) => [c.id, c]));
    const claimMapB = new Map(snapB.frozen_claims.map((c) => [c.id, c]));

    let newClaims = 0;
    let modifiedClaims = 0;

    claimMapB.forEach((c, id) => {
      if (!claimMapA.has(id)) {
        newClaims++;
      } else {
        const prev = claimMapA.get(id)!;
        if (prev.confidence !== c.confidence || prev.stance !== c.stance) {
          modifiedClaims++;
        }
      }
    });

    let removedClaims = 0;
    claimMapA.forEach((_, id) => {
      if (!claimMapB.has(id)) removedClaims++;
    });

    return {
      snapshot_a_id: snapA.snapshot_id,
      snapshot_b_id: snapB.snapshot_id,
      version_a: snapA.version,
      version_b: snapB.version,
      new_claims_count: newClaims,
      removed_claims_count: removedClaims,
      modified_claims_count: modifiedClaims,
      source_delta: snapB.metrics.total_sources - snapA.metrics.total_sources,
      contradiction_delta: snapB.metrics.total_contradictions - snapA.metrics.total_contradictions,
      conclusion_comparison: {
        version_a_summary: snapA.frozen_report?.executive_summary || 'Baseline run summary',
        version_b_summary: snapB.frozen_report?.executive_summary || 'Updated run summary',
        delta_explanation: `Between v${versionA} and v${versionB}, ${newClaims} new empirical claims were cataloged and ${modifiedClaims} claims underwent confidence/stance recalibration.`,
      },
    };
  }
}

export const reproducibilityService = new ReproducibilityService();

