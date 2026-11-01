import { AgentSpecialization } from './agents';

export type SourceType =
  | 'academic_paper'
  | 'industry_report'
  | 'news_article'
  | 'government_policy'
  | 'technical_doc'
  | 'web';

export type ClaimStance = 'supports' | 'contradicts' | 'neutral';

export type EvidenceType =
  | 'empirical'
  | 'statistical'
  | 'regulatory'
  | 'expert_opinion'
  | 'case_study';

export type ContradictionType =
  | 'direct_conflict'
  | 'divergent_metric'
  | 'temporal_drift'
  | 'geographical_context'
  | 'conflicting_assumptions'
  | 'methodological_divergence';

export interface Source {
  id: string;
  research_id: string;
  agent_id?: string;
  website_task_id?: string;
  title: string;
  url: string;
  domain: string;
  source_type: SourceType;
  publication_date?: string;
  retrieved_at: string;
  credibility_assessment?: {
    score: number; // 0 - 100
    authority: 'high' | 'medium' | 'peer_reviewed' | 'official' | 'general';
    rationale: string;
    domain_reputation?: string;
  };
  content_snippet?: string;
  verification_status: 'verified' | 'unverified' | 'flagged';
  claim_count?: number;
}

export interface Claim {
  id: string;
  research_id: string;
  objective_id?: string;
  hypothesis_id?: string;
  source_id: string;
  agent_id?: string;
  claim_text: string;
  original_passage: string;
  stance: ClaimStance;
  evidence_type: EvidenceType;
  confidence: number; // 0.0 - 1.0
  confidence_rationale?: string;
  is_direct_evidence: boolean;
  verification_status: 'verified' | 'unverified' | 'disputed';
  created_at: string;
  // joined fields for UI
  source?: Source;
  objective?: {
    id: string;
    title: string;
    specialization: AgentSpecialization;
  };
  hypothesis?: {
    id: string;
    title: string;
  };
}

export interface Contradiction {
  id: string;
  research_id: string;
  claim_a_id: string;
  claim_b_id: string;
  explanation: string;
  contradiction_type: ContradictionType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution_status: 'unresolved' | 'resolved_temporal' | 'resolved_geographical' | 'inconclusive' | 'verified';
  adaptive_verification_dispatched?: boolean;
  verification_task_id?: string;
  created_at: string;
  claim_a?: Claim;
  claim_b?: Claim;
}
