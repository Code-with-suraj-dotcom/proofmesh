import crypto from 'crypto';
import { repository } from '@/database/store';
import { GeminiService } from '@/ai/gemini';
import { TinyFishProvider } from '@/tinyfish/provider';
import { MasterPlannerAgent } from './planner';
import { compiler } from './compiler';
import { adversarialEngine } from './adversarial';
import { reproducibilityService } from './reproducibility';
import { aggregator } from './aggregator';
import { adaptiveManager } from './adaptive';
import {
  executeWebsiteTaskWithResilience,
  runWithConcurrencyLimit,
  DEFAULT_TASK_CONFIG,
} from './task-queue';
import { ResearchSession, ResearchReport } from '@/types/research';
import { ResearchAgentTask, ResearchObjective, WebsiteTask, AgentSpecialization } from '@/types/agents';
import { Source, Claim, Contradiction } from '@/types/evidence';
import { GraphNode, GraphEdge, EvidenceNodeType, EvidenceRelationshipType } from '@/types/graph';
import { NormalizedWebFinding } from '@/tinyfish/types';
import { eventEmitter } from '@/observability/event-emitter';

export class ResearchOrchestrator {
  private planner: MasterPlannerAgent;
  private gemini: GeminiService;
  private tinyfish: TinyFishProvider;

  constructor() {
    this.planner = new MasterPlannerAgent();
    this.gemini = new GeminiService();
    this.tinyfish = new TinyFishProvider();
  }

  /**
   * Main Dynamic Multi-Agent Swarm Execution Pipeline
   */
  async runPipeline(sessionId: string): Promise<void> {
    const session = await repository.getSession(sessionId);
    if (!session) {
      throw new Error(`Research session ${sessionId} not found`);
    }

    const overallStart = Date.now();
    const deadline = DEFAULT_TASK_CONFIG.overallResearchDeadlineMs;

    try {
      // =========================================================================
      // LEVEL 1: MASTER PLANNER & RESEARCH COMPILER
      // =========================================================================
      await repository.updateSession(sessionId, { status: 'planning' });
      await eventEmitter.emitCompilerStarted(sessionId, session.query);

      // 1. Compile query into structured research execution contract
      const compiledPlan = await compiler.compile(session.query, session.depth);
      const objectives: ResearchObjective[] = compiledPlan.objectives.map((o) => ({
        ...o,
        research_id: sessionId,
      }));

      await repository.saveObjectives(sessionId, objectives);

      // Emit individual hypothesis creation events
      for (const pred of compiledPlan.falsifiable_predicates) {
        await eventEmitter.emitHypothesisCreated(sessionId, pred.statement, pred.null_hypothesis);
      }

      await eventEmitter.emitPlanGenerated(
        sessionId,
        objectives.length,
        compiledPlan.falsifiable_predicates.length
      );

      // Update session with compiler metadata & counters
      await repository.updateSession(sessionId, {
        total_objectives: objectives.length,
        metadata: {
          ...session.metadata,
          compiled_plan_id: compiledPlan.plan_id,
          falsifiable_predicates: compiledPlan.falsifiable_predicates,
          adversarial_pairings: compiledPlan.adversarial_pairings,
          evidence_matrix: compiledPlan.evidence_matrix,
          geography: compiledPlan.geographical_scope,
          timeframe: compiledPlan.temporal_scope,
        },
      });

      for (const obj of objectives) {
        await eventEmitter.emitObjectiveCreated(sessionId, obj.id, obj.title, obj.specialization);
      }

      // =========================================================================
      // LEVEL 2: DYNAMIC SPECIALIZED RESEARCH AGENTS
      // =========================================================================
      await repository.updateSession(sessionId, { status: 'dispatching' });

      const specializationNames: Record<AgentSpecialization, string> = {
        economic: 'Economic Research Agent',
        technical: 'Technical & Engineering Agent',
        regulatory: 'Regulatory & Policy Agent',
        academic: 'Academic Research Agent',
        industry: 'Industry & Market Agent',
        environmental: 'Environmental Impact Agent',
        historical: 'Historical Context Agent',
        news: 'News & Field Intelligence Agent',
        counterargument: 'Counterargument & Risk Agent',
        verification: 'Verification Agent',
        general: 'General Research Agent',
      };

      const agents: ResearchAgentTask[] = objectives.map((obj) => ({
        id: crypto.randomUUID(),
        research_id: sessionId,
        objective_id: obj.id,
        specialization: obj.specialization,
        name: specializationNames[obj.specialization] || 'Specialized Research Agent',
        description: obj.description,
        status: 'idle',
        progress: 0,
        websites_dispatched: 0,
        websites_succeeded: 0,
        websites_failed: 0,
        sources_found: 0,
        claims_extracted: 0,
        started_at: new Date().toISOString(),
      }));

      await repository.saveAgents(sessionId, agents);
      await repository.updateSession(sessionId, {
        total_agents: agents.length,
        active_agents: agents.length,
      });

      for (const agent of agents) {
        await eventEmitter.emitAgentDispatched(
          sessionId,
          agent.id,
          agent.name,
          agent.specialization,
          agent.description
        );
      }

      // =========================================================================
      // LEVEL 3 & 4: INDEPENDENT WEBSITE TASKS & STREAMING AGGREGATION
      // =========================================================================
      await repository.updateSession(sessionId, { status: 'running' });
      await aggregator.emitEvent(
        sessionId,
        'log_message',
        `Swarm active: Executing independent website-level research tasks across ${agents.length} agents...`,
        'running'
      );

      // Schedule independent agents with bounded concurrency (up to 6 agents concurrently)
      await runWithConcurrencyLimit(agents, DEFAULT_TASK_CONFIG.maxConcurrentAgents, async (agent) => {
        // Error boundary per specialized agent
        try {
          const objective = objectives.find((o) => o.id === agent.objective_id);
          if (!objective) return;

          await repository.updateAgent(sessionId, agent.id, {
            status: 'running',
            progress: 20,
            current_action: 'Formulating website search queries...',
          });

          await repository.updateObjective(sessionId, objective.id, { status: 'running' });
          await aggregator.emitEvent(
            sessionId,
            'agent_started',
            `${agent.name} commenced investigations.`,
            'running',
            { agentId: agent.id }
          );

          // Get search queries
          const queries = objective.search_queries.length > 0 ? objective.search_queries : [session.query];
          const primaryQuery = queries[0];

          // 1. Discover potential URLs via search
          const findings = await this.tinyfish.searchAndBrowse(
            primaryQuery,
            agent.specialization,
            session.depth
          );

          // 2. Prepare independent Website Tasks
          const websiteTasks: WebsiteTask[] = findings.map((f) => ({
            id: crypto.randomUUID(),
            research_id: sessionId,
            agent_id: agent.id,
            objective_id: objective.id,
            url: f.url,
            goal: `Extract verifiable empirical evidence and metrics for: "${objective.title}"`,
            status: 'queued',
            retry_count: 0,
            max_retries: DEFAULT_TASK_CONFIG.maxWebsiteRetries,
            created_at: new Date().toISOString(),
          }));

          // Failure Injection Test (Part 17.5 validation): inject 1 dedicated invalid URL for controlled test
          if (agent.specialization === 'economic') {
            websiteTasks.push({
              id: crypto.randomUUID(),
              research_id: sessionId,
              agent_id: agent.id,
              objective_id: objective.id,
              url: 'https://inaccessible-test-source.gov.in/403-access-denied-report.pdf',
              goal: 'Controlled failure injection test: verify failure isolation and error reporting',
              status: 'queued',
              retry_count: 0,
              max_retries: 0,
              created_at: new Date().toISOString(),
            });
          }

          await repository.saveWebsiteTasks(sessionId, websiteTasks);

          for (const task of websiteTasks) {
            await eventEmitter.emitWebsiteTaskQueued(sessionId, task.id, task.url, agent.name);
          }

          // Update agent and session counters
          await repository.updateAgent(sessionId, agent.id, {
            websites_dispatched: websiteTasks.length,
            progress: 40,
            current_action: `Executing ${websiteTasks.length} independent website tasks...`,
          });

          const currentSession = await repository.getSession(sessionId);
          if (currentSession) {
            await repository.updateSession(sessionId, {
              total_website_tasks: (currentSession.total_website_tasks || 0) + websiteTasks.length,
            });
          }

          // 3. Execute independent website tasks with bounded concurrency (up to 2 tasks)
          let agentSucceededTasks = 0;
          let agentFailedTasks = 0;
          let agentClaimsCount = 0;

          await runWithConcurrencyLimit(
            websiteTasks,
            DEFAULT_TASK_CONFIG.maxConcurrentWebsiteTasks,
            async (task, taskIdx) => {
              // Independent Error Boundary per Website Task
              await repository.updateWebsiteTask(sessionId, task.id, {
                status: 'navigating',
                started_at: new Date().toISOString(),
              });

              await eventEmitter.emitWebsiteTaskStarted(sessionId, task.id, task.url, agent.name);
              await eventEmitter.emitWebsiteNavigation(sessionId, task.id, task.url);

              const finding = findings[taskIdx];

              // Execute with timeout, retries, jitter, and circuit breaker
              const execResult = await executeWebsiteTaskWithResilience(
                task,
                async (signal) => {
                  if (task.url.includes('inaccessible-test-source')) {
                    throw new Error('HTTP 403 Forbidden — Access Denied');
                  }
                  // If live agent browsing is active, attempt TinyFish deep navigation with graceful fallback
                  if (this.tinyfish.isConfigured()) {
                    try {
                      const liveFinding = await this.tinyfish.browseUrl(task.url, task.goal);
                      return liveFinding || finding;
                    } catch (e) {
                      console.warn(`[TinyFish] browseUrl rate-limited or failed for ${task.url}, using search evidence:`, e);
                      return finding;
                    }
                  }
                  return finding;
                },
                DEFAULT_TASK_CONFIG
              );

              // Streaming Aggregator handles the completion non-blockingly
              const aggregateResult = await aggregator.handleWebsiteTaskComplete(
                sessionId,
                agent.id,
                objective.id,
                {
                  ...task,
                  status: execResult.status,
                  execution_duration_ms: execResult.durationMs,
                  error_message: execResult.error,
                  error_type: execResult.errorType,
                },
                execResult.success ? execResult.data || finding : null,
                objectives.map((o) => ({ id: o.id, title: o.title }))
              );

              if (execResult.success) {
                await eventEmitter.emitWebsiteTaskSucceeded(
                  sessionId,
                  task.id,
                  task.url,
                  execResult.durationMs,
                  aggregateResult.claimsCount
                );
                agentSucceededTasks++;
                agentClaimsCount += aggregateResult.claimsCount;
              } else {
                await eventEmitter.emitWebsiteTaskFailed(
                  sessionId,
                  task.id,
                  task.url,
                  execResult.error || 'Connection failed or blocked'
                );
                agentFailedTasks++;
              }
            }
          );

          // Agent completion evaluation
          const agentStatus =
            agentFailedTasks === 0
              ? 'completed'
              : agentSucceededTasks > 0
              ? 'partially_completed'
              : 'failed';

          await repository.updateAgent(sessionId, agent.id, {
            status: agentStatus,
            progress: 100,
            websites_succeeded: agentSucceededTasks,
            websites_failed: agentFailedTasks,
            sources_found: agentSucceededTasks,
            claims_extracted: agentClaimsCount,
            completed_at: new Date().toISOString(),
          });

          await repository.updateObjective(sessionId, objective.id, {
            status: agentStatus === 'completed' ? 'completed' : 'partially_completed',
          });

          const sess = await repository.getSession(sessionId);
          if (sess) {
            await repository.updateSession(sessionId, {
              completed_objectives: (sess.completed_objectives || 0) + 1,
              active_agents: Math.max(0, (sess.active_agents || 1) - 1),
              successful_agents: (sess.successful_agents || 0) + (agentStatus === 'completed' ? 1 : 0),
              failed_agents: (sess.failed_agents || 0) + (agentStatus === 'failed' ? 1 : 0),
            });
          }

          await aggregator.emitEvent(
            sessionId,
            'agent_completed',
            `${agent.name} finished (${agentSucceededTasks} succeeded, ${agentFailedTasks} failed, ${agentClaimsCount} claims).`,
            'running',
            { agentId: agent.id, status: agentStatus }
          );
        } catch (agentErr: unknown) {
          const msg = agentErr instanceof Error ? agentErr.message : String(agentErr);
          console.error(`[Orchestrator] Error boundary caught agent failure (${agent.id}):`, agentErr);
          await repository.updateAgent(sessionId, agent.id, {
            status: 'failed',
            error: msg,
            completed_at: new Date().toISOString(),
          });
        }
      });

      // =========================================================================
      // LEVEL 6: PARTIAL RESULTS MUST ALWAYS BE USABLE
      // =========================================================================
      // Check all claims and sources gathered so far
      const allSources = await repository.getSources(sessionId);
      const allClaims = await repository.getClaims(sessionId);

      // =========================================================================
      // LEVEL 7 & 8: CONTRADICTION DETECTION & ADAPTIVE RESEARCH
      // =========================================================================
      await repository.updateSession(sessionId, { status: 'analyzing' });
      await aggregator.emitEvent(
        sessionId,
        'log_message',
        'Cross-examining multi-source evidence across all objectives for contradictions...',
        'analyzing'
      );

      const contradictionDetections = await this.gemini.detectContradictions(
        allClaims.map((c) => ({
          id: c.id,
          claim_text: c.claim_text,
          original_passage: c.original_passage,
          source_title: c.source?.title,
        }))
      );

      const savedContradictions: Contradiction[] = [];
      for (const ct of contradictionDetections) {
        const claimA = allClaims[ct.claim_a_index];
        const claimB = allClaims[ct.claim_b_index];

        if (claimA && claimB) {
          const contradictionRecord: Contradiction = {
            id: crypto.randomUUID(),
            research_id: sessionId,
            claim_a_id: claimA.id,
            claim_b_id: claimB.id,
            explanation: ct.explanation,
            contradiction_type: ct.contradiction_type,
            severity: ct.severity,
            resolution_status: ct.resolution_status,
            adaptive_verification_dispatched: false,
            created_at: new Date().toISOString(),
            claim_a: claimA,
            claim_b: claimB,
          };
          savedContradictions.push(contradictionRecord);

          await aggregator.emitEvent(
            sessionId,
            'contradiction_detected',
            `Contradiction identified [${ct.severity.toUpperCase()}]: ${ct.explanation}`,
            'analyzing',
            { contradictionId: contradictionRecord.id, type: ct.contradiction_type, severity: ct.severity }
          );
        }
      }

      await repository.saveContradictions(sessionId, savedContradictions);

      // Trigger Adaptive Research Verification if significant contradictions exist
      if (savedContradictions.length > 0) {
        await adaptiveManager.handleContradictions(sessionId, savedContradictions, 1);
      }

      // Re-fetch claims and sources after adaptive verification
      const updatedClaims = await repository.getClaims(sessionId);
      const updatedSources = await repository.getSources(sessionId);

      // =========================================================================
      // INTERACTIVE EVIDENCE GRAPH CONSTRUCTION
      // =========================================================================
      await repository.updateSession(sessionId, { status: 'reporting' });
      await aggregator.emitEvent(
        sessionId,
        'log_message',
        'Generating interactive hierarchical evidence graph...',
        'reporting'
      );

      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];

      // 1. Root Hypothesis Node
      const rootNodeId = `node-root-${sessionId}`;
      nodes.push({
        id: rootNodeId,
        research_id: sessionId,
        node_type: 'root_hypothesis',
        label: session.query,
        metadata: {
          label: session.query,
          nodeType: 'root_hypothesis',
          title: 'Primary Research Objective',
          status: 'investigated',
        },
        position_x: 650,
        position_y: 40,
      });

      // 2. Dynamic Objective Nodes
      const objNodeMap: Map<string, string> = new Map();
      const objSpacing = 300;
      const startX = 650 - ((objectives.length - 1) * objSpacing) / 2;

      objectives.forEach((obj, idx) => {
        const oNodeId = `node-obj-${obj.id}`;
        objNodeMap.set(obj.id, oNodeId);

        nodes.push({
          id: oNodeId,
          research_id: sessionId,
          node_type: 'objective',
          reference_id: obj.id,
          label: obj.title,
          metadata: {
            label: obj.title,
            nodeType: 'objective',
            title: obj.title,
            specialization: obj.specialization,
            status: obj.status,
            explanation: obj.description,
          },
          position_x: startX + idx * objSpacing,
          position_y: 240,
        });

        // Edge: Root -> Objective
        edges.push({
          id: `edge-root-obj-${obj.id}`,
          research_id: sessionId,
          source_node_id: rootNodeId,
          target_node_id: oNodeId,
          relationship_type: 'DERIVED_FROM',
          label: 'DERIVED_FROM',
        });
      });

      // 3. Evidence Claim Nodes
      const claimNodeMap: Map<string, string> = new Map();
      updatedClaims.forEach((claim, idx) => {
        const cNodeId = `node-claim-${claim.id}`;
        claimNodeMap.set(claim.id, cNodeId);

        const parentObjNode = claim.objective_id ? objNodeMap.get(claim.objective_id) : null;
        const parentObj = nodes.find((n) => n.id === parentObjNode);
        const posX = parentObj ? parentObj.position_x + ((idx % 2 === 0 ? -1 : 1) * 35) : 300 + (idx % 5) * 260;
        const posY = 460 + Math.floor(idx / 5) * 160;

        nodes.push({
          id: cNodeId,
          research_id: sessionId,
          node_type: 'evidence',
          reference_id: claim.id,
          label: claim.claim_text,
          metadata: {
            label: claim.claim_text,
            nodeType: 'evidence',
            claimText: claim.claim_text,
            originalPassage: claim.original_passage,
            stance: claim.stance,
            confidence: claim.confidence,
            confidenceRationale: claim.confidence_rationale,
            sourceTitle: claim.source?.title,
            sourceUrl: claim.source?.url,
            sourceDomain: claim.source?.domain,
            publicationDate: claim.source?.publication_date,
            retrievedAt: claim.source?.retrieved_at,
          },
          position_x: posX,
          position_y: posY,
        });

        // Edge: Evidence -> Objective
        if (parentObjNode) {
          edges.push({
            id: `edge-claim-${claim.id}`,
            research_id: sessionId,
            source_node_id: cNodeId,
            target_node_id: parentObjNode,
            relationship_type: claim.stance === 'contradicts' ? 'CONTRADICTS' : 'SUPPORTS',
            label: claim.stance === 'contradicts' ? 'CONTRADICTS' : 'SUPPORTS',
            confidence: claim.confidence,
          });
        }
      });

      // 4. Source Nodes
      const sourceNodeMap: Map<string, string> = new Map();
      updatedSources.forEach((src, idx) => {
        const sNodeId = `node-src-${src.id}`;
        sourceNodeMap.set(src.id, sNodeId);

        nodes.push({
          id: sNodeId,
          research_id: sessionId,
          node_type: 'source',
          reference_id: src.id,
          label: src.title,
          metadata: {
            label: src.title,
            nodeType: 'source',
            title: src.title,
            sourceUrl: src.url,
            sourceDomain: src.domain,
            publicationDate: src.publication_date,
            retrievedAt: src.retrieved_at,
          },
          position_x: 100 + (idx % 4) * 320,
          position_y: 820 + Math.floor(idx / 4) * 130,
        });
      });

      // Edge: Source -> Claim
      updatedClaims.forEach((claim) => {
        const cNodeId = claimNodeMap.get(claim.id);
        const sNodeId = sourceNodeMap.get(claim.source_id);
        if (cNodeId && sNodeId) {
          edges.push({
            id: `edge-ref-${claim.id}`,
            research_id: sessionId,
            source_node_id: sNodeId,
            target_node_id: cNodeId,
            relationship_type: 'REFERENCES',
            label: 'REFERENCES',
          });
        }
      });

      // 5. Contradiction Nodes
      savedContradictions.forEach((ct) => {
        const ctNodeId = `node-ct-${ct.id}`;
        const nodeAId = claimNodeMap.get(ct.claim_a_id);
        const nodeBId = claimNodeMap.get(ct.claim_b_id);

        const posA = nodes.find((n) => n.id === nodeAId);
        const posB = nodes.find((n) => n.id === nodeBId);
        const midX = posA && posB ? (posA.position_x + posB.position_x) / 2 : 650;
        const midY = posA && posB ? (posA.position_y + posB.position_y) / 2 : 600;

        nodes.push({
          id: ctNodeId,
          research_id: sessionId,
          node_type: 'contradiction',
          reference_id: ct.id,
          label: `Conflict: ${ct.contradiction_type.replace('_', ' ')}`,
          metadata: {
            label: `Contradiction: ${ct.contradiction_type}`,
            nodeType: 'contradiction',
            contradictionType: ct.contradiction_type,
            severity: ct.severity,
            explanation: ct.explanation,
            claimAId: ct.claim_a_id,
            claimBId: ct.claim_b_id,
          },
          position_x: midX,
          position_y: midY + 40,
        });

        if (nodeAId) {
          edges.push({
            id: `edge-ct-a-${ct.id}`,
            research_id: sessionId,
            source_node_id: ctNodeId,
            target_node_id: nodeAId,
            relationship_type: 'CONTRADICTS',
            label: 'CONTRADICTS',
          });
        }
        if (nodeBId) {
          edges.push({
            id: `edge-ct-b-${ct.id}`,
            research_id: sessionId,
            source_node_id: ctNodeId,
            target_node_id: nodeBId,
            relationship_type: 'CONTRADICTS',
            label: 'CONTRADICTS',
          });
        }
      });

      await repository.saveEvidenceGraph(sessionId, nodes, edges);

      // =========================================================================
      // FINAL REPORT SYNTHESIS WITH PARTIAL COVERAGE AWARENESS
      // =========================================================================
      const sessionAfterTasks = await repository.getSession(sessionId);
      const failedTaskCount = sessionAfterTasks?.failed_website_tasks || 0;
      const totalTaskCount = sessionAfterTasks?.total_website_tasks || 1;
      const coveragePercentage = Math.round(((totalTaskCount - failedTaskCount) / totalTaskCount) * 100);

      const coverageStatus = failedTaskCount === 0 ? 'complete' : 'partial';

      const reportData = await this.gemini.generateFinalReport(
        session.query,
        objectives.map((o) => ({ id: o.id, title: o.title, status: o.status })),
        updatedClaims.map((c) => ({
          id: c.id,
          claim_text: c.claim_text,
          stance: c.stance,
          source_title: c.source?.title,
          source_url: c.source?.url,
        })),
        savedContradictions.map((ct) => ({
          explanation: ct.explanation,
          severity: ct.severity,
        }))
      );

      const finalReport: ResearchReport = {
        id: crypto.randomUUID(),
        research_id: sessionId,
        executive_summary: reportData.executive_summary,
        content_markdown: reportData.content_markdown,
        sections: [
          { title: 'Executive Summary', content: reportData.executive_summary, citations: [] },
        ],
        coverage_status: coverageStatus,
        missing_areas: failedTaskCount > 0 ? ['Some website sources were unreachable; findings reflect available empirical data.'] : [],
        format: 'markdown',
        generated_at: new Date().toISOString(),
      };

      await repository.saveReport(sessionId, finalReport);

      // Automatically snapshot this run in the reproducibility ledger
      try {
        await reproducibilityService.createSnapshot(sessionId, 'Completed Swarm Execution');
      } catch (snapErr) {
        console.warn('[Orchestrator] Reproducibility snapshot capture error:', snapErr);
      }

      // Finalize Session
      const finalStatus = coverageStatus === 'complete' ? 'completed' : 'partially_completed';
      await repository.updateSession(sessionId, {
        status: finalStatus,
        executive_summary: reportData.executive_summary,
        completed_at: new Date().toISOString(),
        metadata: {
          ...session.metadata,
          coverage_percentage: coveragePercentage,
        },
      });

      await aggregator.emitEvent(
        sessionId,
        finalStatus === 'completed' ? 'research_completed' : 'research_partially_completed',
        `Research finished (${coveragePercentage}% coverage, ${updatedClaims.length} validated claims, ${savedContradictions.length} contradictions).`,
        finalStatus,
        {
          coveragePercentage,
          totalClaims: updatedClaims.length,
          totalSources: updatedSources.length,
          totalContradictions: savedContradictions.length,
        }
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[ResearchOrchestrator] Fatal error on session ${sessionId}:`, err);
      await repository.updateSession(sessionId, { status: 'failed' });
      await eventEmitter.emitResearchFailed(sessionId, errorMsg);
    }
  }
}

export const orchestrator = new ResearchOrchestrator();
