export type AgentSpecialization =
  | 'economic'
  | 'technical'
  | 'regulatory'
  | 'academic'
  | 'industry'
  | 'environmental'
  | 'historical'
  | 'news'
  | 'counterargument'
  | 'verification'
  | 'general';

export type AgentType = AgentSpecialization;

export type WebsiteTaskStatus =
  | 'queued'
  | 'waiting'
  | 'navigating'
  | 'reading'
  | 'extracting'
  | 'running'
  | 'succeeded'
  | 'partially_succeeded'
  | 'failed'
  | 'timed_out'
  | 'retrying'
  | 'skipped'
  | 'cancelled';

export interface WebsiteTask {
  id: string;
  research_id: string;
  agent_id: string;
  objective_id?: string;
  url: string;
  goal: string;
  status: WebsiteTaskStatus;
  retry_count: number;
  max_retries: number;
  execution_duration_ms?: number;
  http_status?: number;
  content_size_bytes?: number;
  extracted_claims_count?: number;
  error_message?: string;
  error_type?: 'timeout' | 'blocked' | 'malformed' | 'network' | 'rate_limit' | 'circuit_breaker';
  started_at?: string;
  completed_at?: string;
  raw_result?: unknown;
  created_at: string;
}

export interface ResearchObjective {
  id: string;
  research_id: string;
  parent_objective_id?: string;
  title: string;
  description: string;
  specialization: AgentSpecialization;
  priority: number;
  dependencies: string[]; // IDs of prerequisite objectives
  search_queries: string[];
  preferred_source_types: string[];
  geographical_scope?: string;
  temporal_scope?: string;
  expected_evidence?: string;
  status: 'pending' | 'running' | 'completed' | 'partially_completed' | 'failed' | 'skipped';
  created_at: string;
}

export interface ResearchAgentTask {
  id: string;
  research_id: string;
  objective_id?: string;
  specialization: AgentSpecialization;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'partially_completed' | 'failed' | 'cancelled';
  task_id?: string;
  progress: number; // 0 - 100
  websites_dispatched: number;
  websites_succeeded: number;
  websites_failed: number;
  sources_found: number;
  claims_extracted: number;
  current_action?: string;
  error?: string;
  started_at?: string;
  completed_at?: string;
  metadata?: Record<string, unknown>;
  website_tasks?: WebsiteTask[];
}
