export type ResearchDepth = 'quick' | 'standard' | 'deep';

export type ResearchStatus =
  | 'queued'
  | 'planning'
  | 'dispatching'
  | 'running'
  | 'aggregating'
  | 'analyzing'
  | 'verifying'
  | 'reporting'
  | 'completed'
  | 'partially_completed'
  | 'failed'
  | 'cancelled';

export type ResearchEventType =
  // RESEARCH
  | 'research_created'
  | 'research_started'
  | 'research_completed'
  | 'research_partially_completed'
  | 'research_failed'
  | 'research_cancelled'
  // COMPILER
  | 'compiler_started'
  | 'compiler_completed'
  | 'hypothesis_created'
  | 'research_plan_generated'
  | 'objective_created'
  | 'dependency_resolved'
  // AGENTS
  | 'agent_created'
  | 'agent_dispatched'
  | 'agent_started'
  | 'agent_progress'
  | 'agent_completed'
  | 'agent_failed'
  | 'agent_retrying'
  // WEBSITE TASKS
  | 'website_task_created'
  | 'website_task_queued'
  | 'website_task_started'
  | 'website_navigation_started'
  | 'website_reading_started'
  | 'website_extraction_started'
  | 'website_task_succeeded'
  | 'website_task_failed'
  | 'website_task_timed_out'
  | 'website_task_cancelled'
  // EVIDENCE
  | 'source_discovered'
  | 'source_validated'
  | 'claim_extracted'
  | 'claim_validated'
  | 'claim_disputed'
  | 'contradiction_detected'
  | 'verification_requested'
  | 'verification_completed'
  | 'evidence_extracted'
  // ORCHESTRATION
  | 'adaptive_task_created'
  | 'task_priority_updated'
  | 'budget_warning'
  | 'research_sufficiency_updated'
  | 'research_stopping'
  | 'partial_results_ready'
  | 'log_message';

export interface ResearchCounters {
  total_objectives: number;
  completed_objectives: number;
  total_agents: number;
  active_agents: number;
  successful_agents: number;
  failed_agents: number;
  total_website_tasks: number;
  completed_website_tasks: number;
  failed_website_tasks: number;
  sources_discovered: number;
  claims_extracted: number;
  claims_validated: number;
}

export interface ResearchSession extends ResearchCounters {
  id: string;
  user_id?: string;
  query: string;
  depth: ResearchDepth;
  status: ResearchStatus;
  executive_summary?: string;
  methodology?: string;
  created_at: string;
  completed_at?: string;
  metadata?: {
    entities?: string[];
    geography?: string;
    timeframe?: string;
    constraints?: string[];
    assumptions?: string[];
    domain_filters?: string[];
    source_types?: string[];
    coverage_percentage?: number;
    missing_areas?: string[];
    [key: string]: unknown;
  };
}

export interface ResearchEvent {
  id: string;
  sequence_number?: number;
  research_id: string;
  event_type: ResearchEventType;
  stage?: ResearchStatus;
  agent_id?: string;
  agent_name?: string;
  objective_id?: string;
  website_task_id?: string;
  source_url?: string;
  message: string;
  metadata?: Record<string, unknown>;
  structured_metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ResearchReportSection {
  title: string;
  content: string;
  citations: string[];
}

export interface ResearchReport {
  id: string;
  research_id: string;
  executive_summary: string;
  content_markdown: string;
  sections: ResearchReportSection[];
  coverage_status: 'complete' | 'partial' | 'limited';
  missing_areas?: string[];
  format: 'markdown' | 'pdf';
  generated_at: string;
}
