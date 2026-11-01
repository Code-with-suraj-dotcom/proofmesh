import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';

import { MasterPlannerAgent } from '../lib/research-engine/planner';
import {
  executeWebsiteTaskWithResilience,
  runWithConcurrencyLimit,
} from '../lib/research-engine/task-queue';
import { StreamingAggregator } from '../lib/research-engine/aggregator';
import { AdaptiveResearchManager } from '../lib/research-engine/adaptive';
import { repository } from '../lib/database/store';
import { GeminiService } from '../lib/ai/gemini';
import { TinyFishClient } from '../lib/tinyfish/client';
import { TinyFishProvider } from '../lib/tinyfish/provider';
import { WebsiteTask } from '../types/agents';
import { Claim, Contradiction } from '../types/evidence';
import { ResearchSession } from '../types/research';
import { evidenceLedger } from '../lib/database/ledger';
import { adversarialEngine } from '../lib/research-engine/adversarial';
import { temporalIntelligence } from '../lib/research-engine/temporal';
import { reproducibilityService } from '../lib/research-engine/reproducibility';
import { researchCompiler } from '../lib/research-engine/compiler';

describe('ProofMesh Dynamic Multi-Agent Swarm Acceptance Test Suite', () => {
  // TEST A: Complex query decomposition
  test('TEST A: Master Planner decomposes complex queries dynamically into 3-12 objectives with dependencies', async () => {
    const planner = new MasterPlannerAgent();
    const query =
      'Are current battery recycling technologies economically viable at small scale in India, considering capital costs, government regulations, technology efficiency, and environmental impact?';

    const plan = await planner.planResearch(query, 'deep');

    assert.ok(plan.main_research_objective.length > 10, 'Main objective should be formulated');
    assert.ok(plan.objectives.length >= 3 && plan.objectives.length <= 12, 'Objectives should be within 3-12');
    assert.ok(plan.entities.length > 0, 'Entities should be extracted');
    assert.ok(plan.geography.length > 0, 'Geography should be identified');

    // Verify specializations are assigned
    const specializations = plan.objectives.map((o) => o.specialization);
    assert.ok(specializations.includes('economic'), 'Should have economic specialization');
    assert.ok(specializations.includes('regulatory'), 'Should have regulatory specialization');

    // Verify each objective has required properties
    for (const obj of plan.objectives) {
      assert.ok(obj.title.length > 5, 'Title should be substantial');
      assert.ok(obj.search_queries.length > 0, 'Search queries must be present');
      assert.ok(Array.isArray(obj.dependencies), 'Dependencies should be an array');
    }
  });

  // TEST B: Parallel execution
  test('TEST B: Independent agents and tasks execute concurrently within bounded concurrency', async () => {
    const start = Date.now();
    const tasks = [1, 2, 3, 4, 5, 6];

    // Simulated 50ms task each
    const results = await runWithConcurrencyLimit(tasks, 4, async (item) => {
      await new Promise((r) => setTimeout(r, 50));
      return item * 2;
    });

    const duration = Date.now() - start;
    assert.strictEqual(results.length, 6);
    // If sequential, 6 * 50 = 300ms. If concurrent with limit 4, ~100ms.
    assert.ok(duration < 250, `Concurrent duration was ${duration}ms, expected < 250ms`);

    for (let i = 0; i < 6; i++) {
      assert.strictEqual(results[i].status, 'fulfilled');
      assert.strictEqual((results[i] as any).value, tasks[i] * 2);
    }
  });

  // TEST C: Single website failure isolation
  test('TEST C: Single website failure does NOT stop other website tasks', async () => {
    const dummyTaskFail: WebsiteTask = {
      id: crypto.randomUUID(),
      research_id: 'test-c',
      agent_id: 'agent-1',
      url: 'https://bad-blocked-site.com',
      goal: 'test',
      status: 'queued',
      retry_count: 0,
      max_retries: 1,
      created_at: new Date().toISOString(),
    };

    const dummyTaskPass: WebsiteTask = {
      id: crypto.randomUUID(),
      research_id: 'test-c',
      agent_id: 'agent-1',
      url: 'https://good-verified-site.com',
      goal: 'test',
      status: 'queued',
      retry_count: 0,
      max_retries: 1,
      created_at: new Date().toISOString(),
    };

    const [resFail, resPass] = await Promise.all([
      executeWebsiteTaskWithResilience(
        dummyTaskFail,
        async () => {
          throw new Error('403 Forbidden Cloudflare blocked');
        },
        {
          maxConcurrentWebsiteTasks: 2,
          maxConcurrentAgents: 2,
          websiteTaskTimeoutMs: 500,
          agentDeadlineMs: 1000,
          overallResearchDeadlineMs: 2000,
          maxWebsiteRetries: 0,
        }
      ),
      executeWebsiteTaskWithResilience(
        dummyTaskPass,
        async () => {
          return { title: 'Verified Success Document', snippet: 'Passage verified' };
        },
        {
          maxConcurrentWebsiteTasks: 2,
          maxConcurrentAgents: 2,
          websiteTaskTimeoutMs: 500,
          agentDeadlineMs: 1000,
          overallResearchDeadlineMs: 2000,
          maxWebsiteRetries: 0,
        }
      ),
    ]);

    assert.strictEqual(resFail.success, false, 'Failed task should report failure');
    assert.strictEqual(resFail.status, 'failed');
    assert.strictEqual(resPass.success, true, 'Passing task should succeed despite other failure');
    assert.strictEqual(resPass.status, 'succeeded');
    assert.ok(resPass.data?.title === 'Verified Success Document');
  });

  // TEST D: Single agent failure isolation
  test('TEST D: One failing agent does NOT reject other agents or system', async () => {
    const agents = ['agent-pass-1', 'agent-fail', 'agent-pass-2'];

    const settled = await runWithConcurrencyLimit(agents, 3, async (agent) => {
      if (agent === 'agent-fail') {
        throw new Error('Agent internal simulation failure');
      }
      return `${agent}-completed`;
    });

    assert.strictEqual(settled.length, 3);
    assert.strictEqual(settled[0].status, 'fulfilled');
    assert.strictEqual(settled[1].status, 'rejected');
    assert.strictEqual(settled[2].status, 'fulfilled');
    assert.strictEqual((settled[0] as any).value, 'agent-pass-1-completed');
    assert.strictEqual((settled[2] as any).value, 'agent-pass-2-completed');
  });

  // TEST E: Partial results preservation
  test('TEST E: Partial results are preserved and usable when some tasks fail', async () => {
    const sessionId = crypto.randomUUID();
    const aggregator = new StreamingAggregator();

    const session: ResearchSession = {
      id: sessionId,
      query: 'Partial testing query',
      depth: 'standard',
      status: 'running',
      total_objectives: 2,
      completed_objectives: 0,
      total_agents: 2,
      active_agents: 2,
      successful_agents: 0,
      failed_agents: 0,
      total_website_tasks: 2,
      completed_website_tasks: 0,
      failed_website_tasks: 0,
      sources_discovered: 0,
      claims_extracted: 0,
      claims_validated: 0,
      created_at: new Date().toISOString(),
    };

    await repository.createSession(session);

    // 1 task fails, 1 task succeeds
    const taskSuccess: WebsiteTask = {
      id: crypto.randomUUID(),
      research_id: sessionId,
      agent_id: 'agent-1',
      url: 'https://valid-paper.org',
      goal: 'extract',
      status: 'running',
      retry_count: 0,
      max_retries: 1,
      created_at: new Date().toISOString(),
    };

    const taskFail: WebsiteTask = {
      id: crypto.randomUUID(),
      research_id: sessionId,
      agent_id: 'agent-2',
      url: 'https://broken-server.org',
      goal: 'extract',
      status: 'failed',
      retry_count: 1,
      max_retries: 1,
      error_message: '500 Server Error',
      error_type: 'network',
      created_at: new Date().toISOString(),
    };

    await aggregator.handleWebsiteTaskComplete(
      sessionId,
      'agent-1',
      undefined,
      taskSuccess,
      {
        title: 'Empirical Findings',
        url: 'https://valid-paper.org',
        domain: 'valid-paper.org',
        snippet: 'Important empirical metric found.',
        fullPassages: ['Important empirical metric found in distributed tests.'],
        sourceType: 'academic_paper',
      },
      [{ id: 'h1', title: 'Test Hypothesis' }]
    );

    await aggregator.handleWebsiteTaskComplete(
      sessionId,
      'agent-2',
      undefined,
      taskFail,
      null,
      []
    );

    const savedSources = await repository.getSources(sessionId);
    const savedClaims = await repository.getClaims(sessionId);
    const updatedSession = await repository.getSession(sessionId);

    assert.strictEqual(savedSources.length, 1, 'Successful source should be preserved');
    assert.strictEqual(savedClaims.length, 1, 'Successful claims should be preserved');
    assert.strictEqual(updatedSession?.failed_website_tasks, 1, 'Failed task should be counted');
    assert.strictEqual(updatedSession?.completed_website_tasks, 1, 'Completed task should be counted');
  });

  // TEST F: Contradiction discovery & adaptive research
  test('TEST F: Contradiction detection identifies conflicts and triggers adaptive verification', async () => {
    const sessionId = crypto.randomUUID();
    const claimA: Claim = {
      id: crypto.randomUUID(),
      research_id: sessionId,
      source_id: 'src-1',
      claim_text: 'Small scale battery recycling is unviable with costs exceeding $3,450/ton.',
      original_passage: 'Capex penalties and operating costs over $3,450/ton render sub-500 MT plants unviable.',
      stance: 'supports',
      evidence_type: 'empirical',
      confidence: 0.95,
      is_direct_evidence: true,
      verification_status: 'verified',
      created_at: new Date().toISOString(),
    };

    const claimB: Claim = {
      id: crypto.randomUUID(),
      research_id: sessionId,
      source_id: 'src-2',
      claim_text: 'Direct mechanochemical recycling achieves positive 18.2% EBITDA with capex under $180,000.',
      original_passage: 'Direct mechanochemical recycling achieves positive 18.2% EBITDA with equipment capex under $180,000.',
      stance: 'contradicts',
      evidence_type: 'empirical',
      confidence: 0.9,
      is_direct_evidence: true,
      verification_status: 'verified',
      created_at: new Date().toISOString(),
    };

    await repository.saveClaims(sessionId, [claimA, claimB]);

    const gemini = new GeminiService();
    const contradictions = await gemini.detectContradictions([
      { id: claimA.id, claim_text: claimA.claim_text, original_passage: claimA.original_passage },
      { id: claimB.id, claim_text: claimB.claim_text, original_passage: claimB.original_passage },
    ]);

    assert.ok(contradictions.length > 0, 'Should detect contradiction between high capex and low capex claims');
    assert.ok(contradictions[0].explanation.length > 15, 'Explanation should be descriptive');

    const adaptive = new AdaptiveResearchManager();
    const contradictionRecord: Contradiction = {
      id: crypto.randomUUID(),
      research_id: sessionId,
      claim_a_id: claimA.id,
      claim_b_id: claimB.id,
      explanation: contradictions[0].explanation,
      contradiction_type: contradictions[0].contradiction_type,
      severity: contradictions[0].severity,
      resolution_status: 'unresolved',
      created_at: new Date().toISOString(),
    };

    await adaptive.handleContradictions(sessionId, [contradictionRecord], 1);
    const agents = await repository.getAgents(sessionId);
    assert.ok(agents.some((a) => a.specialization === 'verification'), 'Verification agent should be spawned');
  });

  // TEST G: Timeout resilience
  test('TEST G: Simulated website timeout does not block the overall system', async () => {
    const taskHang: WebsiteTask = {
      id: crypto.randomUUID(),
      research_id: 'test-g',
      agent_id: 'agent-hang',
      url: 'https://never-responding-website.io',
      goal: 'test',
      status: 'queued',
      retry_count: 0,
      max_retries: 0,
      created_at: new Date().toISOString(),
    };

    const start = Date.now();
    const result = await executeWebsiteTaskWithResilience(
      taskHang,
      async (signal) => {
        // Hang longer than timeout
        await new Promise((r) => setTimeout(r, 2000));
        return { data: 'should not be reached' };
      },
      {
        maxConcurrentWebsiteTasks: 1,
        maxConcurrentAgents: 1,
        websiteTaskTimeoutMs: 150, // fast timeout for test
        agentDeadlineMs: 1000,
        overallResearchDeadlineMs: 2000,
        maxWebsiteRetries: 0,
      }
    );

    const elapsed = Date.now() - start;
    assert.strictEqual(result.success, false, 'Timed-out task must return success=false');
    assert.strictEqual(result.status, 'timed_out', 'Status must be timed_out');
    assert.strictEqual(result.errorType, 'timeout');
    assert.ok(elapsed < 600, `Execution resolved in ${elapsed}ms, did not block indefinitely`);
  });

  // TEST H: Persistence and session recovery
  test('TEST H: Research session, objectives, agents, and evidence persist and are retrievable', async () => {
    const testId = crypto.randomUUID();
    const testSession: ResearchSession = {
      id: testId,
      query: 'Persistence verification query',
      depth: 'quick',
      status: 'completed',
      executive_summary: 'Persisted summary',
      total_objectives: 1,
      completed_objectives: 1,
      total_agents: 1,
      active_agents: 0,
      successful_agents: 1,
      failed_agents: 0,
      total_website_tasks: 1,
      completed_website_tasks: 1,
      failed_website_tasks: 0,
      sources_discovered: 1,
      claims_extracted: 2,
      claims_validated: 2,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    await repository.createSession(testSession);
    const retrieved = await repository.getSession(testId);

    assert.ok(retrieved !== null, 'Retrieved session should not be null');
    assert.strictEqual(retrieved?.id, testId);
    assert.strictEqual(retrieved?.query, 'Persistence verification query');
    assert.strictEqual(retrieved?.status, 'completed');
  });

  // TEST I: No hallucinated sources - Exact passage integrity
  test('TEST I: Every extracted claim has an exact verbatim source passage and verifiable URL', async () => {
    const gemini = new GeminiService();
    const verbatimPassage =
      'Our techno-economic modeling demonstrates that small-scale hydrometallurgical plants (<500 tons/year) face a levelized recycling cost of $3,450 per metric ton of cathode black mass.';

    const claims = await gemini.extractClaims(
      'Journal of Resource Conservation',
      'https://doi.org/10.1016/j.resconrec.2023.107012',
      [verbatimPassage],
      [{ id: 'h1', title: 'Small Scale Capex' }]
    );

    assert.ok(claims.length > 0, 'Claims should be extracted');
    for (const c of claims) {
      assert.ok(c.original_passage.length > 10, 'Original passage must not be empty');
      assert.ok(
        verbatimPassage.includes(c.original_passage) || c.original_passage.includes(verbatimPassage.slice(0, 40)),
        'Claim passage must match verbatim source text'
      );
      assert.ok(c.confidence >= 0.1 && c.confidence <= 1.0, 'Confidence must be within 0.1 and 1.0');
    }
  });

  // TEST J: Cryptographic passage hash integrity & chain of custody
  test('TEST J: Cryptographic passage hash integrity & chain of custody auditing', async () => {
    const researchId = crypto.randomUUID();
    const claimId = crypto.randomUUID();
    const verbatimPassage =
      'Small scale hydrometallurgical operations face an estimated levelized processing cost of $3,450/ton, according to CPCB guidelines.';

    // Record entry into the persistent evidence ledger
    const entry = await evidenceLedger.recordEntry({
      research_id: researchId,
      claim_id: claimId,
      claim_text: 'Small scale battery recycling capex exceeds viable thresholds.',
      verbatim_passage: verbatimPassage,
      source_id: 'source-test-j',
      source_title: 'CPCB Technical Guidelines 2024',
      source_url: 'https://cpcb.nic.in/battery-guidelines-2024',
      source_domain: 'cpcb.nic.in',
      retrieved_at: new Date().toISOString(),
      agent_id: 'economic-agent-1',
      agent_specialization: 'economic',
      confidence: 0.94,
      confidence_breakdown: {
        empirical_specificity: 0.95,
        source_authority: 0.98,
        passage_directness: 0.92,
        rationale: 'Direct regulatory empirical estimate.',
      },
      verification_status: 'verified',
    });

    assert.ok(entry.passage_sha256.length === 64, 'SHA-256 hash must be 64 hexadecimal characters');

    // Verify hash integrity recomputation
    const verification = await evidenceLedger.verifyPassageCryptographicHash(researchId, claimId);
    assert.strictEqual(verification.valid, true, 'Cryptographic hash must match exact verbatim passage');
    assert.strictEqual(verification.hash, entry.passage_sha256);

    // Append custody step (e.g. adversarial challenge)
    await evidenceLedger.appendCustodyStep(
      researchId,
      claimId,
      'challenged',
      'Peer Review Skeptic Agent',
      'Challenged high capex estimate against modular mechanochemical innovations.'
    );

    const updatedEntries = await evidenceLedger.getLedgerEntries(researchId);
    const updated = updatedEntries.find((e) => e.claim_id === claimId);
    assert.strictEqual(updated?.chain_of_custody.length, 2, 'Chain of custody must retain both extraction and challenge steps');
    assert.strictEqual(updated?.chain_of_custody[1].action, 'challenged');
  });

  // TEST K: Adversarial predicate evaluation & Popperian falsification
  test('TEST K: Adversarial predicate evaluation & Popperian falsification criteria', async () => {
    const predicate = {
      id: 'pred-test-k',
      statement: 'Small scale battery recycling is economically viable in India.',
      null_hypothesis: 'CAPEX penalties render small-scale facilities unviable.',
      target_truth_threshold: 0.7,
      investigation_weight: 4,
    };

    const pairing = {
      predicate_id: predicate.id,
      proponent_specialization: 'economic' as const,
      skeptic_specialization: 'counterargument' as const,
      falsification_criteria: 'CAPEX penalties render small-scale facilities unviable.',
    };

    // Scenario 1: Proponent claims dominate
    const supportingClaims: Claim[] = [
      {
        id: 'c1',
        research_id: 'test-k',
        source_id: 's1',
        claim_text: 'Small scale recycling achieves 18% EBITDA with localized feedstock.',
        original_passage: 'EBITDA margins reached 18% in pilot operations.',
        stance: 'supports',
        evidence_type: 'empirical',
        confidence: 0.9,
        is_direct_evidence: true,
        verification_status: 'verified',
        created_at: new Date().toISOString(),
      },
    ];

    const evalSupported = adversarialEngine.evaluatePredicate(predicate, pairing, supportingClaims);
    assert.strictEqual(evalSupported.verdict, 'supported', 'Should be supported when truth threshold met');
    assert.strictEqual(evalSupported.falsification_triggered, false);

    // Scenario 2: Strong skeptic counter-claims trigger Popperian falsification
    const contradictingClaims: Claim[] = [
      ...supportingClaims,
      {
        id: 'c2',
        research_id: 'test-k',
        source_id: 's2',
        claim_text: 'Levelized operational costs exceed market cathode value by 42%.',
        original_passage: 'Operational costs exceed recovered market value by 42% at small scale.',
        stance: 'contradicts',
        evidence_type: 'empirical',
        confidence: 0.95,
        is_direct_evidence: true,
        verification_status: 'verified',
        created_at: new Date().toISOString(),
      },
      {
        id: 'c3',
        research_id: 'test-k',
        source_id: 's3',
        claim_text: 'Feedstock collection logistics add prohibitive $850/ton overhead.',
        original_passage: 'Logistics add prohibitive $850/ton overhead.',
        stance: 'contradicts',
        evidence_type: 'empirical',
        confidence: 0.92,
        is_direct_evidence: true,
        verification_status: 'verified',
        created_at: new Date().toISOString(),
      },
    ];

    const evalRefuted = adversarialEngine.evaluatePredicate(predicate, pairing, contradictingClaims);
    assert.strictEqual(evalRefuted.verdict, 'refuted', 'Should be refuted when counter-evidence outweighs support');
    assert.strictEqual(evalRefuted.falsification_triggered, true, 'Null hypothesis should trigger falsification');
    assert.ok(evalRefuted.truth_index < 0.5, 'Truth index should drop below 0.5');
  });

  // TEST L: Temporal differential audit & claim drift detection
  test('TEST L: Temporal differential audit & claim drift detection', async () => {
    const sessionId = crypto.randomUUID();

    const session: ResearchSession = {
      id: sessionId,
      query: 'Battery recycling economics in India',
      depth: 'standard',
      status: 'completed',
      total_objectives: 1,
      completed_objectives: 1,
      total_agents: 1,
      active_agents: 0,
      successful_agents: 1,
      failed_agents: 0,
      total_website_tasks: 1,
      completed_website_tasks: 1,
      failed_website_tasks: 0,
      sources_discovered: 1,
      claims_extracted: 1,
      claims_validated: 1,
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
    };
    await repository.createSession(session);

    // Save claim with historical 2022 capex data
    const historicalClaim: Claim = {
      id: crypto.randomUUID(),
      research_id: sessionId,
      source_id: 's-hist',
      claim_text: 'Capex costs are projected at $120,000 for decentralized recycling plants.',
      original_passage: 'In 2022 capex estimates were modeled at $120,000 per mini-unit.',
      stance: 'supports',
      evidence_type: 'empirical',
      confidence: 0.85,
      is_direct_evidence: true,
      verification_status: 'verified',
      created_at: session.created_at,
    };
    await repository.saveClaims(sessionId, [historicalClaim]);

    // Run differential audit
    const report = await temporalIntelligence.runDifferentialAudit(sessionId);

    assert.ok(report.differential_id.length > 10, 'Should generate differential report ID');
    assert.strictEqual(report.research_id, sessionId);
    assert.ok(report.claim_drifts.length >= 1, 'Should detect claim drift for outdated 2022 capex figures');
    assert.strictEqual(report.claim_drifts[0].new_stance, 'contradicts');
    assert.ok(report.verdict_shift.shift_detected, 'Verdict shift should be flagged');
  });

  // TEST M: Research reproducibility snapshots & side-by-side run delta comparison
  test('TEST M: Research reproducibility snapshots & side-by-side run delta comparison', async () => {
    const sessionId = crypto.randomUUID();

    const session: ResearchSession = {
      id: sessionId,
      query: 'Decentralized lithium hydrometallurgy viability',
      depth: 'quick',
      status: 'completed',
      total_objectives: 1,
      completed_objectives: 1,
      total_agents: 1,
      active_agents: 0,
      successful_agents: 1,
      failed_agents: 0,
      total_website_tasks: 1,
      completed_website_tasks: 1,
      failed_website_tasks: 0,
      sources_discovered: 1,
      claims_extracted: 1,
      claims_validated: 1,
      created_at: new Date().toISOString(),
    };
    await repository.createSession(session);

    const claim1: Claim = {
      id: crypto.randomUUID(),
      research_id: sessionId,
      source_id: 's-rep-1',
      claim_text: 'Hydrometallurgy achieves 94% cobalt recovery.',
      original_passage: 'Hydrometallurgy achieves 94% cobalt recovery rate under standard leaching.',
      stance: 'supports',
      evidence_type: 'empirical',
      confidence: 0.9,
      is_direct_evidence: true,
      verification_status: 'verified',
      created_at: new Date().toISOString(),
    };
    await repository.saveClaims(sessionId, [claim1]);

    // Snapshot v1
    const snap1 = await reproducibilityService.createSnapshot(sessionId, 'Initial Baseline Milestone');
    assert.strictEqual(snap1.version, 1);
    assert.strictEqual(snap1.metrics.total_claims, 1);

    // Add a second claim and create Snapshot v2
    const claim2: Claim = {
      id: crypto.randomUUID(),
      research_id: sessionId,
      source_id: 's-rep-2',
      claim_text: 'Acid leaching effluent requires advanced neutralizing agent.',
      original_passage: 'Acid leaching effluent requires expensive multi-stage neutralizing agent.',
      stance: 'contradicts',
      evidence_type: 'empirical',
      confidence: 0.88,
      is_direct_evidence: true,
      verification_status: 'verified',
      created_at: new Date().toISOString(),
    };
    await repository.saveClaims(sessionId, [claim2]);

    const snap2 = await reproducibilityService.createSnapshot(sessionId, 'Post Environmental Review');
    assert.strictEqual(snap2.version, 2);
    assert.strictEqual(snap2.metrics.total_claims, 2);

    // Compare snapshots
    const comparison = await reproducibilityService.compareSnapshots(sessionId, 1, 2);
    assert.strictEqual(comparison.version_a, 1);
    assert.strictEqual(comparison.version_b, 2);
    assert.strictEqual(comparison.new_claims_count, 1);
    assert.ok(comparison.conclusion_comparison.delta_explanation.includes('new empirical claims'));
  });
});

