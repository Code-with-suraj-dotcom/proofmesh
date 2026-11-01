import crypto from 'crypto';
import { repository } from '@/database/store';
import { TinyFishProvider } from '@/tinyfish/provider';
import { Contradiction, Claim } from '@/types/evidence';
import { ResearchAgentTask, WebsiteTask } from '@/types/agents';
import { aggregator } from './aggregator';

export class AdaptiveResearchManager {
  private tinyfish: TinyFishProvider;
  private maxAdaptiveIterations = 2;

  constructor() {
    this.tinyfish = new TinyFishProvider();
  }

  /**
   * Evaluates detected contradictions and dynamically spawns targeted verification agents
   */
  async handleContradictions(
    researchId: string,
    contradictions: Contradiction[],
    currentIteration = 1
  ): Promise<void> {
    if (currentIteration > this.maxAdaptiveIterations || contradictions.length === 0) {
      return;
    }

    for (const contradiction of contradictions) {
      if (contradiction.adaptive_verification_dispatched) continue;

      // Only investigate high or critical severity contradictions
      if (contradiction.severity === 'high' || contradiction.severity === 'critical') {
        await this.dispatchVerificationAgent(researchId, contradiction, currentIteration);
      }
    }
  }

  private async dispatchVerificationAgent(
    researchId: string,
    contradiction: Contradiction,
    iteration: number
  ): Promise<void> {
    const claims = await repository.getClaims(researchId);
    const claimA = claims.find((c) => c.id === contradiction.claim_a_id);
    const claimB = claims.find((c) => c.id === contradiction.claim_b_id);

    if (!claimA || !claimB) return;

    // Mark contradiction as verification in progress
    await repository.saveContradictions(researchId, [
      {
        ...contradiction,
        adaptive_verification_dispatched: true,
      },
    ]);

    await aggregator.emitEvent(
      researchId,
      'verification_requested',
      `Adaptive Research triggered: Investigating ${contradiction.contradiction_type} conflict between Claim A and Claim B.`,
      'verifying',
      { contradictionId: contradiction.id, severity: contradiction.severity }
    );

    // 1. Create a specialized Verification Agent
    const verificationAgentId = crypto.randomUUID();
    const verificationAgent: ResearchAgentTask = {
      id: verificationAgentId,
      research_id: researchId,
      specialization: 'verification',
      name: `Verification Agent (Iteration ${iteration})`,
      description: `Cross-examining conflict: "${contradiction.explanation.slice(0, 100)}..."`,
      status: 'running',
      progress: 20,
      websites_dispatched: 1,
      websites_succeeded: 0,
      websites_failed: 0,
      sources_found: 0,
      claims_extracted: 0,
      started_at: new Date().toISOString(),
    };

    await repository.saveAgents(researchId, [verificationAgent]);

    // Update session active agent count
    const session = await repository.getSession(researchId);
    if (session) {
      await repository.updateSession(researchId, {
        total_agents: (session.total_agents || 0) + 1,
        active_agents: (session.active_agents || 0) + 1,
      });
    }

    // 2. Dispatch targeted verification search
    const verificationQuery = `independent validation primary data: ${claimA.claim_text.slice(0, 40)} vs ${claimB.claim_text.slice(0, 40)}`;

    const websiteTaskId = crypto.randomUUID();
    const websiteTask: WebsiteTask = {
      id: websiteTaskId,
      research_id: researchId,
      agent_id: verificationAgentId,
      url: `https://verification.research/${encodeURIComponent(contradiction.contradiction_type)}`,
      goal: `Resolve conflict: ${contradiction.explanation}`,
      status: 'running',
      retry_count: 0,
      max_retries: 2,
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    await repository.saveWebsiteTasks(researchId, [websiteTask]);

    try {
      const findings = await this.tinyfish.searchAndBrowse(
        verificationQuery,
        'counterargument',
        'standard'
      );

      let extractedCount = 0;
      for (const finding of findings) {
        const res = await aggregator.handleWebsiteTaskComplete(
          researchId,
          verificationAgentId,
          claimA.objective_id,
          {
            ...websiteTask,
            url: finding.url,
            status: 'succeeded',
            execution_duration_ms: 1200,
          },
          finding,
          [{ id: 'verify-1', title: 'Empirical Verification of Conflicting Metrics' }]
        );
        extractedCount += res.claimsCount;
      }

      await repository.updateAgent(researchId, verificationAgentId, {
        status: 'completed',
        progress: 100,
        websites_succeeded: 1,
        sources_found: findings.length,
        claims_extracted: extractedCount,
        completed_at: new Date().toISOString(),
      });

      await aggregator.emitEvent(
        researchId,
        'agent_completed',
        `Verification Agent completed cross-examination with ${extractedCount} corroborating claims.`,
        'verifying',
        { agentId: verificationAgentId }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await repository.updateAgent(researchId, verificationAgentId, {
        status: 'partially_completed',
        error: msg,
        completed_at: new Date().toISOString(),
      });
    }
  }
}

export const adaptiveManager = new AdaptiveResearchManager();

