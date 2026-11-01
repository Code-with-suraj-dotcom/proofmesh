import {
  TinyFishSearchResponse,
  TinyFishAutomationPayload,
  TinyFishAsyncRunResponse,
  TinyFishRunStatusResponse,
  TinyFishResearchPayload,
  TinyFishResearchResponse,
} from './types';

const AGENT_BASE_URL = 'https://agent.tinyfish.ai';
const SEARCH_BASE_URL = 'https://api.search.tinyfish.ai';
const FETCH_BASE_URL = 'https://api.fetch.tinyfish.ai';

export class TinyFishClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TINYFISH_API_KEY || '';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  private getHeaders(): Record<string, string> {
    if (!this.apiKey) {
      throw new Error('TINYFISH_API_KEY is not configured in environment.');
    }
    return {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  /**
   * Search the live web using TinyFish Search API
   */
  async search(query: string, recencyMinutes?: number): Promise<TinyFishSearchResponse> {
    const url = new URL(SEARCH_BASE_URL);
    url.searchParams.set('query', query);
    if (recencyMinutes) {
      url.searchParams.set('recency_minutes', recencyMinutes.toString());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`TinyFish Search API error (${response.status}): ${errText}`);
    }

    return (await response.json()) as TinyFishSearchResponse;
  }

  /**
   * Run an autonomous web agent synchronously
   */
  async runAgentSync(payload: TinyFishAutomationPayload): Promise<TinyFishRunStatusResponse> {
    const response = await fetch(`${AGENT_BASE_URL}/v1/automation/run`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(180000), // 3 min
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`TinyFish Automation Run error (${response.status}): ${errText}`);
    }

    return (await response.json()) as TinyFishRunStatusResponse;
  }

  /**
   * Start an autonomous web agent asynchronously
   */
  async runAgentAsync(payload: TinyFishAutomationPayload): Promise<TinyFishAsyncRunResponse> {
    const response = await fetch(`${AGENT_BASE_URL}/v1/automation/run-async`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`TinyFish Automation Run-Async error (${response.status}): ${errText}`);
    }

    return (await response.json()) as TinyFishAsyncRunResponse;
  }

  /**
   * Poll run status
   */
  async getRunStatus(runId: string): Promise<TinyFishRunStatusResponse> {
    const response = await fetch(`${AGENT_BASE_URL}/v1/runs/${encodeURIComponent(runId)}`, {
      method: 'GET',
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`TinyFish Run Status error (${response.status}): ${errText}`);
    }

    return (await response.json()) as TinyFishRunStatusResponse;
  }

  /**
   * Cancel an ongoing run
   */
  async cancelRun(runId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${AGENT_BASE_URL}/v1/runs/${encodeURIComponent(runId)}/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`TinyFish Run Cancel error (${response.status}): ${errText}`);
    }

    return (await response.json()) as { success: boolean };
  }

  /**
   * Run multi-source web research
   */
  async runResearch(payload: TinyFishResearchPayload): Promise<TinyFishResearchResponse> {
    const response = await fetch(`${AGENT_BASE_URL}/v1/automation/run-research`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        query: payload.query,
        mode: payload.mode || 'standard',
        stream: false,
      }),
      signal: AbortSignal.timeout(240000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`TinyFish Run Research error (${response.status}): ${errText}`);
    }

    return (await response.json()) as TinyFishResearchResponse;
  }

  /**
   * Render and fetch webpage markdown
   */
  async fetchPage(url: string): Promise<{ markdown: string; title?: string }> {
    const response = await fetch(FETCH_BASE_URL, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`TinyFish Fetch error (${response.status}): ${errText}`);
    }

    return (await response.json()) as { markdown: string; title?: string };
  }
}

