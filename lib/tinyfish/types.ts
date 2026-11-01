export interface TinyFishSearchResult {
  position: number;
  site_name: string;
  title: string;
  snippet: string;
  url: string;
}

export interface TinyFishSearchResponse {
  query: string;
  results: TinyFishSearchResult[];
  total_results?: number;
  page?: number;
}

export interface TinyFishAutomationPayload {
  url: string;
  goal: string;
  output_schema?: Record<string, unknown>;
  browser_profile?: 'lite' | 'stealth';
  proxy_config?: {
    enabled: boolean;
    type: 'tinyfish' | 'custom';
    country_code?: string;
  };
  agent_config?: {
    mode?: 'strict' | 'lenient';
    max_steps?: number;
    max_duration_seconds?: number;
  };
}

export interface TinyFishAsyncRunResponse {
  run_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  created_at?: string;
}

export interface TinyFishRunStatusResponse {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: {
    data?: unknown;
    extracted_text?: string;
    markdown?: string;
    claims?: Array<{
      claim: string;
      passage: string;
      confidence?: number;
    }>;
  };
  error?: string;
  logs?: string[];
  duration_seconds?: number;
}

export interface TinyFishResearchPayload {
  query: string;
  mode?: 'quick' | 'standard' | 'deep';
  stream?: boolean;
  domain_filters?: string[];
}

export interface TinyFishResearchResponse {
  research_run_id?: string;
  summary?: string;
  report_markdown?: string;
  sources?: Array<{
    title: string;
    url: string;
    site_name?: string;
    snippet?: string;
    extracted_passages?: string[];
  }>;
}

export interface NormalizedWebFinding {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  fullPassages: string[];
  publicationDate?: string;
  sourceType: 'academic_paper' | 'industry_report' | 'news_article' | 'government_policy' | 'technical_doc' | 'web';
  rawResponse?: unknown;
}

