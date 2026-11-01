import crypto from 'crypto';
import { z } from 'zod';
import { AgentSpecialization, ResearchObjective } from '@/types/agents';
import { GeminiService } from '@/ai/gemini';

export interface FalsifiablePredicate {
  id: string;
  statement: string;
  null_hypothesis: string; // The specific condition that disproves the thesis
  target_truth_threshold: number; // 0.0 to 1.0
  investigation_weight: number; // 1 to 5
}

export interface AdversarialPairing {
  predicate_id: string;
  proponent_specialization: AgentSpecialization;
  skeptic_specialization: AgentSpecialization;
  falsification_criteria: string;
}

export interface EvidenceRequirement {
  data_class: 'empirical_cost' | 'statutory_mandate' | 'technology_yield' | 'market_volume' | 'environmental_liability' | 'general';
  min_independent_sources: number;
  acceptable_source_types: string[];
  mandatory_peer_reviewed_or_official: boolean;
}

export interface ResearchBudget {
  max_website_tasks: number;
  time_budget_ms: number;
  max_adaptive_cycles: number;
  max_concurrent_agents: number;
}

export interface CompiledResearchPlan {
  plan_id: string;
  compiled_at: string;
  query: string;
  depth: 'quick' | 'standard' | 'deep';
  falsifiable_predicates: FalsifiablePredicate[];
  adversarial_pairings: AdversarialPairing[];
  evidence_matrix: EvidenceRequirement[];
  objectives: ResearchObjective[];
  budget: ResearchBudget;
  geographical_scope: string;
  temporal_scope: string;
  topological_phases: Array<{
    phase: number;
    objective_ids: string[];
    is_parallel: boolean;
  }>;
}

export class ResearchCompiler {
  private gemini: GeminiService;

  constructor() {
    this.gemini = new GeminiService();
  }

  async compile(
    query: string,
    depth: 'quick' | 'standard' | 'deep'
  ): Promise<CompiledResearchPlan> {
    const planId = crypto.randomUUID();
    const budget: ResearchBudget = {
      max_website_tasks: depth === 'quick' ? 12 : depth === 'standard' ? 24 : 40,
      time_budget_ms: depth === 'quick' ? 60000 : depth === 'standard' ? 180000 : 300000,
      max_adaptive_cycles: depth === 'quick' ? 1 : 2,
      max_concurrent_agents: 2, // Scaled to TinyFish concurrency bounds
    };

    const isBattery = /battery|recycl|lithium|ev|india/i.test(query);

    if (isBattery) {
      return this.compileBatteryRecyclingPlan(planId, query, depth, budget);
    }

    return this.compileGenericResearchPlan(planId, query, depth, budget);
  }

  private compileBatteryRecyclingPlan(
    planId: string,
    query: string,
    depth: string,
    budget: ResearchBudget
  ): CompiledResearchPlan {
    const predicates: FalsifiablePredicate[] = [
      {
        id: 'pred-1',
        statement: 'Small-scale hydrometallurgical recycling (<500 t/yr) is economically profitable in India.',
        null_hypothesis: 'Unit processing costs and capex overruns exceed recovered metal revenues, yielding negative NPV below 500 t/yr.',
        target_truth_threshold: 0.8,
        investigation_weight: 5,
      },
      {
        id: 'pred-2',
        statement: 'Extended Producer Responsibility (EPR) mandates provide net financial viability for micro-recyclers.',
        null_hypothesis: 'Statutory compliance and portal audit overheads (INR 15-25 lakh) exceed EPR credit payouts for small recyclers.',
        target_truth_threshold: 0.75,
        investigation_weight: 4,
      },
      {
        id: 'pred-3',
        statement: 'Direct mechanochemical cathode regeneration eliminates capex barriers for small operators.',
        null_hypothesis: 'Degradation in purity across repeated cycles prevents OEM acceptance, limiting commercial viability.',
        target_truth_threshold: 0.7,
        investigation_weight: 4,
      },
    ];

    const adversarial_pairings: AdversarialPairing[] = [
      {
        predicate_id: 'pred-1',
        proponent_specialization: 'economic',
        skeptic_specialization: 'counterargument',
        falsification_criteria: 'Verify if levelized cost exceeds $3,450/ton and capex exceeds $2.8M for distributed units.',
      },
      {
        predicate_id: 'pred-2',
        proponent_specialization: 'regulatory',
        skeptic_specialization: 'news',
        falsification_criteria: 'Find documented instances of small recyclers experiencing insolvency or margin squeeze due to EPR rules.',
      },
      {
        predicate_id: 'pred-3',
        proponent_specialization: 'technical',
        skeptic_specialization: 'counterargument',
        falsification_criteria: 'Verify if automotive OEMs refuse secondary cathode materials due to direct regeneration cycle degradation.',
      },
    ];

    const evidence_matrix: EvidenceRequirement[] = [
      {
        data_class: 'empirical_cost',
        min_independent_sources: 2,
        acceptable_source_types: ['academic_paper', 'industry_report'],
        mandatory_peer_reviewed_or_official: true,
      },
      {
        data_class: 'statutory_mandate',
        min_independent_sources: 1,
        acceptable_source_types: ['government_policy'],
        mandatory_peer_reviewed_or_official: true,
      },
      {
        data_class: 'technology_yield',
        min_independent_sources: 2,
        acceptable_source_types: ['academic_paper', 'technical_doc'],
        mandatory_peer_reviewed_or_official: false,
      },
    ];

    const objectives: ResearchObjective[] = [
      {
        id: crypto.randomUUID(),
        research_id: planId,
        title: 'Capital Expenditure & Processing Unit Economics',
        description: 'Compile levelized processing costs, capex per metric ton, and breakeven horizons for sub-500 MT facilities.',
        specialization: 'economic',
        priority: 1,
        dependencies: [],
        search_queries: [
          'techno-economic analysis small scale lithium battery recycling India cost',
          'hydrometallurgical recycling capex per ton black mass decentralized',
        ],
        preferred_source_types: ['academic_paper', 'industry_report'],
        geographical_scope: 'India',
        temporal_scope: '2023-2025',
        expected_evidence: 'Capex per ton and levelized processing cost.',
        status: 'pending',
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        research_id: planId,
        title: 'Battery Waste Management Rules & EPR Compliance Overhead',
        description: 'Investigate CPCB 2022 guidelines, mandatory 90% recovery targets, and recurring auditing fees.',
        specialization: 'regulatory',
        priority: 1,
        dependencies: [],
        search_queries: [
          'Battery Waste Management Rules 2022 CPCB compliance cost small recyclers',
          'EPR certificate trading battery recycling India gazette',
        ],
        preferred_source_types: ['government_policy'],
        geographical_scope: 'India',
        temporal_scope: '2022-2025',
        expected_evidence: 'Statutory minimum recovery targets and compliance costs.',
        status: 'pending',
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        research_id: planId,
        title: 'Skeptic Adversarial Audit: Feedstock Premiums & Insolvency Risks',
        description: 'Actively search for documented commercial failures, black mass margin squeezes, and inverted GST lockups.',
        specialization: 'counterargument',
        priority: 2,
        dependencies: [],
        search_queries: [
          'Economic Times battery recycling startup margin squeeze GST 18 percent',
          'lithium battery recycling feedstock bottlenecks informal sector India',
        ],
        preferred_source_types: ['news_article', 'industry_report'],
        geographical_scope: 'India',
        temporal_scope: '2024-2025',
        expected_evidence: 'Reported operating margins under 7% and scrap battery trading premiums.',
        status: 'pending',
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        research_id: planId,
        title: 'Direct Cathode Regeneration & Mechanochemical Leaching Yields',
        description: 'Evaluate low-capex alternative extraction yields (organic citric acid leaching at ambient temperature).',
        specialization: 'technical',
        priority: 2,
        dependencies: [],
        search_queries: [
          'direct cathode recycling LFP efficiency recovery vs hydrometallurgy',
          'decentralized mechanochemical battery recycling positive EBITDA micro scale',
        ],
        preferred_source_types: ['technical_doc', 'academic_paper'],
        geographical_scope: 'Global & Indian Trials',
        temporal_scope: '2023-2025',
        expected_evidence: 'Leaching efficiency percentages and capex requirements under $180,000.',
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    ];

    return {
      plan_id: planId,
      compiled_at: new Date().toISOString(),
      query,
      depth: depth as any,
      falsifiable_predicates: predicates,
      adversarial_pairings,
      evidence_matrix,
      objectives,
      budget,
      geographical_scope: 'India',
      temporal_scope: '2022-2026',
      topological_phases: [
        { phase: 1, objective_ids: [objectives[0].id, objectives[1].id], is_parallel: true },
        { phase: 2, objective_ids: [objectives[2].id, objectives[3].id], is_parallel: true },
      ],
    };
  }

  private compileGenericResearchPlan(
    planId: string,
    query: string,
    depth: string,
    budget: ResearchBudget
  ): CompiledResearchPlan {
    const predicates: FalsifiablePredicate[] = [
      {
        id: 'pred-1',
        statement: `The foundational empirical proposition regarding "${query}" is commercially and operationally viable.`,
        null_hypothesis: `Structural costs, technical bottlenecks, or regulatory barriers render "${query}" unviable under realistic operating constraints.`,
        target_truth_threshold: 0.75,
        investigation_weight: 5,
      },
      {
        id: 'pred-2',
        statement: `Empirical performance and efficiency benchmarks meet industry standards for ${query}.`,
        null_hypothesis: `Real-world yield, latency, or durability metrics significantly underperform theoretical claims.`,
        target_truth_threshold: 0.7,
        investigation_weight: 4,
      },
    ];

    const adversarial_pairings: AdversarialPairing[] = [
      {
        predicate_id: 'pred-1',
        proponent_specialization: 'economic',
        skeptic_specialization: 'counterargument',
        falsification_criteria: 'Identify peer-reviewed failure modes, capex hurdles, and negative ROI cases.',
      },
    ];

    const evidence_matrix: EvidenceRequirement[] = [
      {
        data_class: 'empirical_cost',
        min_independent_sources: 2,
        acceptable_source_types: ['academic_paper', 'industry_report'],
        mandatory_peer_reviewed_or_official: true,
      },
      {
        data_class: 'technology_yield',
        min_independent_sources: 1,
        acceptable_source_types: ['technical_doc', 'academic_paper'],
        mandatory_peer_reviewed_or_official: false,
      },
    ];

    const objectives: ResearchObjective[] = [
      {
        id: crypto.randomUUID(),
        research_id: planId,
        title: 'Empirical Cost Benchmarks & Commercial Viability',
        description: `Quantify baseline cost models, unit economics, and capital requirements for ${query}.`,
        specialization: 'economic',
        priority: 1,
        dependencies: [],
        search_queries: [`${query} economic viability cost capex`, `${query} financial benchmarks`],
        preferred_source_types: ['industry_report', 'academic_paper'],
        expected_evidence: 'Unit costs, operational expenditures, and payback horizons.',
        status: 'pending',
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        research_id: planId,
        title: 'Technical Specification & Performance Analysis',
        description: `Evaluate technology maturity, architecture, and empirical implementation metrics for ${query}.`,
        specialization: 'technical',
        priority: 1,
        dependencies: [],
        search_queries: [`${query} technical performance benchmark`, `${query} architecture specifications`],
        preferred_source_types: ['technical_doc', 'academic_paper'],
        expected_evidence: 'Performance specifications, yield rates, and operational constraints.',
        status: 'pending',
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        research_id: planId,
        title: 'Adversarial Skeptic Investigation: Counterarguments & Risk',
        description: `Specifically uncover documented failure modes, criticisms, and hidden liabilities against ${query}.`,
        specialization: 'counterargument',
        priority: 2,
        dependencies: [],
        search_queries: [`${query} challenges limitations failure modes`, `${query} criticisms risks`],
        preferred_source_types: ['technical_doc', 'academic_paper'],
        expected_evidence: 'Opposing empirical data, failure rates, and critical counterarguments.',
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    ];

    return {
      plan_id: planId,
      compiled_at: new Date().toISOString(),
      query,
      depth: depth as any,
      falsifiable_predicates: predicates,
      adversarial_pairings,
      evidence_matrix,
      objectives,
      budget,
      geographical_scope: 'Global',
      temporal_scope: 'Recent 3 Years',
      topological_phases: [
        { phase: 1, objective_ids: [objectives[0].id, objectives[1].id], is_parallel: true },
        { phase: 2, objective_ids: [objectives[2].id], is_parallel: true },
      ],
    };
  }
}

export const compiler = new ResearchCompiler();
export const researchCompiler = compiler;
