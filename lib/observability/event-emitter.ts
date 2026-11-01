import { eventStore } from './event-store';
import { eventBus } from './event-bus';
import { ResearchEvent, ResearchEventType, ResearchStatus } from '@/types/research';

export interface EmitEventOptions {
  stage?: ResearchStatus;
  agentId?: string;
  agentName?: string;
  objectiveId?: string;
  websiteTaskId?: string;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
  structuredMetadata?: Record<string, unknown>;
}

class EventEmitterService {
  /**
   * Main unified event emission method: persists to store & broadcasts to bus
   */
  async emit(
    researchId: string,
    eventType: ResearchEventType,
    message: string,
    options: EmitEventOptions = {}
  ): Promise<ResearchEvent> {
    const persisted = await eventStore.appendEvent({
      research_id: researchId,
      event_type: eventType,
      stage: options.stage,
      agent_id: options.agentId,
      agent_name: options.agentName,
      objective_id: options.objectiveId,
      website_task_id: options.websiteTaskId,
      source_url: options.sourceUrl,
      message,
      metadata: options.metadata,
      structured_metadata: options.structuredMetadata || options.metadata,
    });

    // Broadcast in real-time across SSE and WebSocket subscribers
    eventBus.publish(persisted);

    return persisted;
  }

  // --- RESEARCH LIFECYCLE ---
  async emitResearchCreated(researchId: string, query: string, depth: string) {
    return this.emit(researchId, 'research_created', `Research session initialized: "${query}"`, {
      stage: 'queued',
      metadata: { query, depth },
    });
  }

  async emitResearchStarted(researchId: string) {
    return this.emit(researchId, 'research_started', 'Autonomous Multi-Agent Research Swarm launched.', {
      stage: 'running',
    });
  }

  async emitResearchCompleted(researchId: string, summary: string, metadata?: Record<string, unknown>) {
    return this.emit(researchId, 'research_completed', `Investigation completed: ${summary}`, {
      stage: 'completed',
      metadata,
    });
  }

  async emitResearchFailed(researchId: string, error: string) {
    return this.emit(researchId, 'research_failed', `Investigation halted due to critical error: ${error}`, {
      stage: 'failed',
      metadata: { error },
    });
  }

  async emitResearchCancelled(researchId: string) {
    return this.emit(researchId, 'research_cancelled', 'Investigation halted by user intervention.', {
      stage: 'cancelled',
    });
  }

  // --- COMPILER EVENTS ---
  async emitCompilerStarted(researchId: string, query: string) {
    return this.emit(
      researchId,
      'compiler_started',
      'Research Compiler is analyzing your question and generating the investigation plan.',
      {
        stage: 'planning',
        metadata: { query },
      }
    );
  }

  async emitHypothesisCreated(researchId: string, statement: string, nullHypothesis: string) {
    return this.emit(
      researchId,
      'hypothesis_created',
      `Formulated Falsifiable Hypothesis: "${statement}" (Null hypothesis: "${nullHypothesis}")`,
      {
        stage: 'planning',
        metadata: { statement, nullHypothesis },
      }
    );
  }

  async emitPlanGenerated(researchId: string, objectivesCount: number, predicatesCount: number) {
    return this.emit(
      researchId,
      'research_plan_generated',
      `Investigation plan formulated: ${objectivesCount} objectives with ${predicatesCount} falsifiable predicates.`,
      {
        stage: 'planning',
        metadata: { objectivesCount, predicatesCount },
      }
    );
  }

  async emitObjectiveCreated(researchId: string, objectiveId: string, title: string, specialization: string) {
    return this.emit(
      researchId,
      'objective_created',
      `Created Objective: "${title}" [${specialization.toUpperCase()}]`,
      {
        stage: 'planning',
        objectiveId,
        metadata: { specialization },
      }
    );
  }

  // --- AGENT LIFECYCLE ---
  async emitAgentDispatched(researchId: string, agentId: string, name: string, specialization: string, objective: string) {
    return this.emit(
      researchId,
      'agent_dispatched',
      `Deploying research agent: ${name} to investigate "${objective.slice(0, 80)}..."`,
      {
        stage: 'dispatching',
        agentId,
        agentName: name,
        metadata: { specialization, objective },
      }
    );
  }

  async emitAgentStarted(researchId: string, agentId: string, name: string) {
    return this.emit(
      researchId,
      'agent_started',
      `${name} started active investigation.`,
      {
        stage: 'running',
        agentId,
        agentName: name,
      }
    );
  }

  async emitAgentProgress(researchId: string, agentId: string, name: string, action: string, progress: number) {
    return this.emit(
      researchId,
      'agent_progress',
      `${name}: ${action}`,
      {
        stage: 'running',
        agentId,
        agentName: name,
        metadata: { progress, action },
      }
    );
  }

  async emitAgentCompleted(researchId: string, agentId: string, name: string, claimsFound: number) {
    return this.emit(
      researchId,
      'agent_completed',
      `${name} completed mission: discovered ${claimsFound} verified claims.`,
      {
        stage: 'running',
        agentId,
        agentName: name,
        metadata: { claimsFound },
      }
    );
  }

  async emitAgentFailed(researchId: string, agentId: string, name: string, error: string) {
    return this.emit(
      researchId,
      'agent_failed',
      `${name} encountered error: ${error}`,
      {
        stage: 'running',
        agentId,
        agentName: name,
        metadata: { error },
      }
    );
  }

  // --- WEBSITE TASKS ---
  async emitWebsiteTaskQueued(researchId: string, taskId: string, url: string, agentName: string) {
    return this.emit(
      researchId,
      'website_task_queued',
      `Queued target website: ${url} for ${agentName}`,
      {
        stage: 'running',
        websiteTaskId: taskId,
        sourceUrl: url,
        agentName,
      }
    );
  }

  async emitWebsiteTaskStarted(researchId: string, taskId: string, url: string, agentName: string) {
    return this.emit(
      researchId,
      'website_task_started',
      `Initiating browsing session on ${url} (${agentName})`,
      {
        stage: 'running',
        websiteTaskId: taskId,
        sourceUrl: url,
        agentName,
      }
    );
  }

  async emitWebsiteNavigation(researchId: string, taskId: string, url: string) {
    return this.emit(
      researchId,
      'website_navigation_started',
      `Navigating to ${url}...`,
      {
        stage: 'running',
        websiteTaskId: taskId,
        sourceUrl: url,
      }
    );
  }

  async emitWebsiteReading(researchId: string, taskId: string, url: string) {
    return this.emit(
      researchId,
      'website_reading_started',
      `Reading document and parsing structure on ${url}`,
      {
        stage: 'running',
        websiteTaskId: taskId,
        sourceUrl: url,
      }
    );
  }

  async emitWebsiteExtraction(researchId: string, taskId: string, url: string) {
    return this.emit(
      researchId,
      'website_extraction_started',
      `Extracting structured empirical claims and passages from ${url}`,
      {
        stage: 'running',
        websiteTaskId: taskId,
        sourceUrl: url,
      }
    );
  }

  async emitWebsiteTaskSucceeded(researchId: string, taskId: string, url: string, durationMs: number, claimsCount: number) {
    return this.emit(
      researchId,
      'website_task_succeeded',
      `Successfully processed ${url} in ${(durationMs / 1000).toFixed(1)}s (extracted ${claimsCount} claims).`,
      {
        stage: 'running',
        websiteTaskId: taskId,
        sourceUrl: url,
        metadata: { durationMs, claimsCount },
      }
    );
  }

  async emitWebsiteTaskFailed(researchId: string, taskId: string, url: string, reason: string, action = 'Continuing with next independent source.') {
    return this.emit(
      researchId,
      'website_task_failed',
      `Failed to fetch ${url}: ${reason}. Action: ${action}`,
      {
        stage: 'running',
        websiteTaskId: taskId,
        sourceUrl: url,
        metadata: { reason, action },
      }
    );
  }

  // --- EVIDENCE DISCOVERY ---
  async emitSourceDiscovered(researchId: string, title: string, url: string, agentName: string) {
    return this.emit(
      researchId,
      'source_discovered',
      `Discovered primary source: "${title}" (${url}) by ${agentName}`,
      {
        stage: 'running',
        sourceUrl: url,
        agentName,
        metadata: { title },
      }
    );
  }

  async emitClaimExtracted(researchId: string, claimText: string, sourceDomain: string, confidence: number) {
    return this.emit(
      researchId,
      'claim_extracted',
      `Extracted claim: "${claimText.slice(0, 90)}..." from ${sourceDomain} (confidence: ${Math.round(confidence * 100)}%)`,
      {
        stage: 'running',
        metadata: { claimText, sourceDomain, confidence },
      }
    );
  }

  async emitContradictionDetected(researchId: string, explanation: string, severity: string) {
    return this.emit(
      researchId,
      'contradiction_detected',
      `Material contradiction detected (${severity}): ${explanation}`,
      {
        stage: 'running',
        metadata: { explanation, severity },
      }
    );
  }

  async emitVerificationRequested(researchId: string, contradictionId: string) {
    return this.emit(
      researchId,
      'verification_requested',
      'Adaptive research triggered: Dispatching specialized Verification Agent to resolve conflicting evidence.',
      {
        stage: 'verifying',
        metadata: { contradictionId },
      }
    );
  }
}

export const eventEmitter = new EventEmitterService();

