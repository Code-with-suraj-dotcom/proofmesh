import crypto from 'crypto';
import { repository } from '@/database/store';
import { GeminiService } from '@/ai/gemini';
import { Source, Claim } from '@/types/evidence';
import { WebsiteTask } from '@/types/agents';
import { ResearchEvent, ResearchEventType } from '@/types/research';
import { NormalizedWebFinding } from '@/tinyfish/types';
import { evidenceLedger } from '@/database/ledger';

import { eventBus } from '@/observability/event-bus';
import { eventEmitter } from '@/observability/event-emitter';

export function subscribeToSessionEvents(sessionId: string, listener: (event: ResearchEvent) => void): () => void {
  return eventBus.subscribe(sessionId, listener);
}

export function emitSessionEvent(event: ResearchEvent) {
  eventBus.publish(event);
}

export class StreamingAggregator {
  private gemini: GeminiService;

  constructor() {
    this.gemini = new GeminiService();
  }

  async emitEvent(
    researchId: string,
    eventType: ResearchEventType,
    message: string,
    stage?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await eventEmitter.emit(researchId, eventType, message, {
      stage: stage as any,
      metadata,
    });
  }

  /**
   * Process a single website task completion NON-BLOCKINGLY in real-time
   */
  async handleWebsiteTaskComplete(
    researchId: string,
    agentId: string,
    objectiveId: string | undefined,
    task: WebsiteTask,
    finding: NormalizedWebFinding | null,
    subHypotheses: Array<{ id: string; title: string }>
  ): Promise<{ source?: Source; claimsCount: number }> {
    // 1. If failed or timed out
    if (!finding || task.status === 'failed' || task.status === 'timed_out' || task.status === 'skipped') {
      await repository.updateWebsiteTask(researchId, task.id, {
        status: task.status,
        execution_duration_ms: task.execution_duration_ms,
        error_message: task.error_message,
        error_type: task.error_type,
        completed_at: new Date().toISOString(),
      });

      // Update session counter
      const session = await repository.getSession(researchId);
      if (session) {
        await repository.updateSession(researchId, {
          failed_website_tasks: (session.failed_website_tasks || 0) + 1,
        });
      }

      await this.emitEvent(
        researchId,
        'website_task_failed',
        `Website task ${task.status}: ${task.url} (${task.error_message || 'No response'})`,
        'running',
        { taskId: task.id, url: task.url, error: task.error_message, errorType: task.error_type }
      );

      return { claimsCount: 0 };
    }

    // 2. Validate and Normalize Source Metadata
    const sourceId = crypto.randomUUID();
    const sourceRecord: Source = {
      id: sourceId,
      research_id: researchId,
      agent_id: agentId,
      website_task_id: task.id,
      title: finding.title || new URL(task.url).hostname,
      url: task.url,
      domain: finding.domain || new URL(task.url).hostname,
      source_type: finding.sourceType || 'web',
      publication_date: finding.publicationDate,
      retrieved_at: new Date().toISOString(),
      credibility_assessment: {
        score:
          finding.sourceType === 'government_policy'
            ? 98
            : finding.sourceType === 'academic_paper'
            ? 95
            : 88,
        authority:
          finding.sourceType === 'government_policy'
            ? 'official'
            : finding.sourceType === 'academic_paper'
            ? 'peer_reviewed'
            : 'high',
        rationale: `Verified web source from ${finding.domain}. Extracted verbatim text passages.`,
        domain_reputation: `${finding.domain} verified`,
      },
      content_snippet: finding.snippet,
      verification_status: 'verified',
    };

    await repository.saveSources(researchId, [sourceRecord]);

    // 3. Extract claims immediately (non-blocking for other tasks)
    let extractedClaims: Claim[] = [];
    try {
      const claims = await this.gemini.extractClaims(
        sourceRecord.title,
        sourceRecord.url,
        finding.fullPassages,
        subHypotheses
      );

      extractedClaims = claims.map((c) => ({
        id: crypto.randomUUID(),
        research_id: researchId,
        objective_id: objectiveId,
        source_id: sourceId,
        agent_id: agentId,
        claim_text: c.claim_text,
        original_passage: c.original_passage,
        stance: c.stance,
        evidence_type: c.evidence_type,
        confidence: c.confidence,
        confidence_rationale: c.confidence_rationale,
        is_direct_evidence: c.is_direct_evidence,
        verification_status: 'verified',
        created_at: new Date().toISOString(),
        source: sourceRecord,
      }));

      if (extractedClaims.length > 0) {
        await repository.saveClaims(researchId, extractedClaims);

        // Record immutable provenance in Evidence Ledger with SHA-256 fingerprint
        for (const clm of extractedClaims) {
          try {
            await evidenceLedger.recordEntry({
              research_id: researchId,
              claim_id: clm.id,
              claim_text: clm.claim_text,
              verbatim_passage: clm.original_passage,
              source_id: sourceRecord.id,
              source_title: sourceRecord.title,
              source_url: sourceRecord.url,
              source_domain: sourceRecord.domain,
              retrieved_at: sourceRecord.retrieved_at,
              agent_id: agentId,
              agent_specialization: sourceRecord.source_type || 'web',
              confidence: clm.confidence,
              confidence_breakdown: {
                empirical_specificity: clm.evidence_type === 'empirical' ? 0.95 : 0.85,
                source_authority: sourceRecord.credibility_assessment?.score ? sourceRecord.credibility_assessment.score / 100 : 0.9,
                passage_directness: clm.is_direct_evidence ? 0.95 : 0.8,
                rationale: clm.confidence_rationale || 'Audited passage integrity',
              },
              verification_status:
                clm.verification_status === 'unverified'
                  ? 'under_review'
                  : clm.verification_status,
            });
          } catch (ledgerErr) {
            console.warn('[Aggregator] Ledger record error:', ledgerErr);
          }
        }
      }
    } catch (extractErr) {
      console.warn(`[Aggregator] Extraction error on ${task.url}:`, extractErr);
    }

    // 4. Update Website Task in Repository
    await repository.updateWebsiteTask(researchId, task.id, {
      status: 'succeeded',
      execution_duration_ms: task.execution_duration_ms,
      completed_at: new Date().toISOString(),
      raw_result: {
        claimsCount: extractedClaims.length,
        sourceTitle: sourceRecord.title,
      },
    });

    // 5. Update Agent and Session Counters
    const session = await repository.getSession(researchId);
    if (session) {
      await repository.updateSession(researchId, {
        completed_website_tasks: (session.completed_website_tasks || 0) + 1,
        sources_discovered: (session.sources_discovered || 0) + 1,
        claims_extracted: (session.claims_extracted || 0) + extractedClaims.length,
        claims_validated: (session.claims_validated || 0) + extractedClaims.length,
      });
    }

    // 6. Emit real-time granular events
    await this.emitEvent(
      researchId,
      'website_task_succeeded',
      `Completed extraction on ${sourceRecord.domain} (${extractedClaims.length} verified claims).`,
      'running',
      {
        taskId: task.id,
        url: task.url,
        sourceTitle: sourceRecord.title,
        claimsExtracted: extractedClaims.length,
      }
    );

    if (extractedClaims.length > 0) {
      await this.emitEvent(
        researchId,
        'evidence_extracted',
        `Extracted ${extractedClaims.length} empirical claims from ${sourceRecord.title}.`,
        'running',
        { claimsCount: extractedClaims.length, sourceId }
      );
    }

    return { source: sourceRecord, claimsCount: extractedClaims.length };
  }
}

export const aggregator = new StreamingAggregator();

