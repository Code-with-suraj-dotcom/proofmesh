import { WebsiteTask, WebsiteTaskStatus } from '@/types/agents';

export interface TaskQueueConfig {
  maxConcurrentWebsiteTasks: number; // default: 8
  maxConcurrentAgents: number; // default: 6
  websiteTaskTimeoutMs: number; // default: 60,000 (60s)
  agentDeadlineMs: number; // default: 180,000 (180s)
  overallResearchDeadlineMs: number; // default: 300,000 (300s)
  maxWebsiteRetries: number; // default: 2
}

export const DEFAULT_TASK_CONFIG: TaskQueueConfig = {
  maxConcurrentWebsiteTasks: 2, // Optimized for TinyFish 2-run concurrency tier
  maxConcurrentAgents: 2,
  websiteTaskTimeoutMs: 20000, // Responsive 20s timeout per attempt
  agentDeadlineMs: 180000,
  overallResearchDeadlineMs: 300000,
  maxWebsiteRetries: 1, // Single fast retry to prevent UI stagnation
};

// Circuit Breaker for repeatedly failing hostnames/domains
class DomainCircuitBreaker {
  private failureCounts: Map<string, number> = new Map();
  private lastFailureTimes: Map<string, number> = new Map();
  private threshold = 3;
  private coolDownMs = 120000; // 2 minutes

  isBlocked(domain: string): boolean {
    const failures = this.failureCounts.get(domain) || 0;
    if (failures < this.threshold) return false;
    const lastTime = this.lastFailureTimes.get(domain) || 0;
    if (Date.now() - lastTime > this.coolDownMs) {
      // Cooldown expired, half-open
      this.failureCounts.set(domain, this.threshold - 1);
      return false;
    }
    return true;
  }

  recordFailure(domain: string) {
    const cur = (this.failureCounts.get(domain) || 0) + 1;
    this.failureCounts.set(domain, cur);
    this.lastFailureTimes.set(domain, Date.now());
  }

  recordSuccess(domain: string) {
    this.failureCounts.delete(domain);
    this.lastFailureTimes.delete(domain);
  }
}

export const circuitBreaker = new DomainCircuitBreaker();

export interface ExecutionResult<T> {
  success: boolean;
  status: WebsiteTaskStatus;
  data?: T;
  error?: string;
  errorType?: WebsiteTask['error_type'];
  durationMs: number;
  retryCount: number;
}

/**
 * Executes an individual website task with per-task timeout, AbortController,
 * hard timeout race, exponential backoff retry with jitter, circuit breaker check, and strict error isolation.
 */
export async function executeWebsiteTaskWithResilience<T>(
  task: WebsiteTask,
  executeFn: (signal: AbortSignal) => Promise<T>,
  config: TaskQueueConfig = DEFAULT_TASK_CONFIG
): Promise<ExecutionResult<T>> {
  const domain = extractDomain(task.url);
  const startTime = Date.now();

  // 1. Check Circuit Breaker
  if (domain && circuitBreaker.isBlocked(domain)) {
    return {
      success: false,
      status: 'skipped',
      error: `Circuit breaker active for domain ${domain} due to consecutive failures`,
      errorType: 'circuit_breaker',
      durationMs: Date.now() - startTime,
      retryCount: 0,
    };
  }

  let attempt = 0;
  let lastError: Error | null = null;
  let lastErrorType: WebsiteTask['error_type'] = 'network';

  while (attempt <= task.max_retries) {
    attempt++;
    const controller = new AbortController();

    let timeoutId: NodeJS.Timeout | null = null;
    const abortPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error(`Website task timed out after ${config.websiteTaskTimeoutMs}ms`));
      }, config.websiteTaskTimeoutMs);
    });

    try {
      // Hard race between executeFn and the timeout
      const data = await Promise.race([
        executeFn(controller.signal),
        abortPromise,
      ]);

      if (timeoutId) clearTimeout(timeoutId);

      if (domain) circuitBreaker.recordSuccess(domain);

      return {
        success: true,
        status: 'succeeded',
        data,
        durationMs: Date.now() - startTime,
        retryCount: attempt - 1,
      };
    } catch (err: unknown) {
      if (timeoutId) clearTimeout(timeoutId);
      const isAbort = controller.signal.aborted;
      const errMsg = err instanceof Error ? err.message : String(err);

      if (isAbort || errMsg.includes('timed out')) {
        lastErrorType = 'timeout';
      } else if (errMsg.includes('403') || errMsg.includes('blocked') || errMsg.includes('Cloudflare')) {
        lastErrorType = 'blocked';
      } else if (errMsg.includes('JSON') || errMsg.includes('malformed') || errMsg.includes('parse')) {
        lastErrorType = 'malformed';
      } else if (errMsg.includes('429') || errMsg.includes('rate limit')) {
        lastErrorType = 'rate_limit';
      } else {
        lastErrorType = 'network';
      }

      lastError = err instanceof Error ? err : new Error(errMsg);

      // Only retry transient errors (network, timeout, rate_limit). Do not retry blocked or permanent errors.
      const isTransient =
        lastErrorType === 'timeout' ||
        lastErrorType === 'network' ||
        lastErrorType === 'rate_limit';

      if (attempt <= task.max_retries && isTransient) {
        const jitter = Math.floor(Math.random() * 300);
        const backoff = Math.min(500 * Math.pow(2, attempt) + jitter, 3000);
        await new Promise((r) => setTimeout(r, backoff));
      } else {
        break;
      }
    }
  }

  if (domain && (lastErrorType === 'timeout' || lastErrorType === 'network')) {
    circuitBreaker.recordFailure(domain);
  }

  return {
    success: false,
    status: lastErrorType === 'timeout' ? 'timed_out' : 'failed',
    error: lastError?.message || 'Execution failed',
    errorType: lastErrorType,
    durationMs: Date.now() - startTime,
    retryCount: attempt - 1,
  };
}

/**
 * Bounded Concurrency Task Pool
 * Runs tasks with a maximum concurrency limit, settling each task independently.
 */
export async function runWithConcurrencyLimit<T, R>(
  items: T[],
  limit: number,
  workerFn: (item: T, index: number) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let currentIndex = 0;

  async function next(): Promise<void> {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      try {
        const val = await workerFn(items[idx], idx);
        results[idx] = { status: 'fulfilled', value: val };
      } catch (err) {
        results[idx] = { status: 'rejected', reason: err };
      }
    }
  }

  const pool = Array.from({ length: Math.min(limit, items.length) }, () => next());
  await Promise.all(pool);
  return results;
}

function extractDomain(urlStr: string): string | null {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return null;
  }
}
