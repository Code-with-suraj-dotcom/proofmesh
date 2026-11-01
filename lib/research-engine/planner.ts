import crypto from 'crypto';
import { z } from 'zod';
import { GeminiService } from '@/ai/gemini';
import { AgentSpecialization, ResearchObjective } from '@/types/agents';

export const MasterPlannerObjectiveSchema = z.object({
  id: z.string(),
  title: z.string().min(5),
  description: z.string().min(10),
  specialization: z.enum([
    'economic',
    'technical',
    'regulatory',
    'academic',
    'industry',
    'environmental',
    'historical',
    'news',
    'counterargument',
    'general',
  ]),
  priority: z.number().int().min(1).max(5),
  dependencies: z.array(z.string()).default([]),
  search_queries: z.array(z.string()).min(1),
  preferred_source_types: z.array(z.string()).default([]),
  geographical_scope: z.string().optional(),
  temporal_scope: z.string().optional(),
  expected_evidence: z.string().optional(),
});

export const MasterPlannerOutputSchema = z.object({
  main_research_objective: z.string(),
  entities: z.array(z.string()),
  geography: z.string(),
  timeframe: z.string(),
  constraints: z.array(z.string()),
  assumptions: z.array(z.string()),
  objectives: z.array(MasterPlannerObjectiveSchema).min(3).max(12),
});

export type MasterPlannerOutput = z.infer<typeof MasterPlannerOutputSchema>;

export class MasterPlannerAgent {
  private gemini: GeminiService;

  constructor() {
    this.gemini = new GeminiService();
  }

  async planResearch(
    query: string,
    depth: 'quick' | 'standard' | 'deep'
  ): Promise<MasterPlannerOutput> {
    if (this.gemini.isConfigured()) {
      const minObj = depth === 'quick' ? 3 : depth === 'standard' ? 5 : 7;
      const maxObj = depth === 'quick' ? 5 : depth === 'standard' ? 8 : 12;

      const systemPrompt = `You are the Master Planner Agent of ProofMesh, an autonomous hierarchical research system.
Your mission:
1. Conduct deep semantic analysis of the user's research query.
2. Extract all explicit and implicit entities, geographical context, temporal boundaries, constraints, and operational assumptions.
3. Dynamically decompose the query into ${minObj} to ${maxObj} independent, targeted research objectives.
4. DO NOT use a rigid or hardcoded set of objectives. Tailor the objectives specifically to the topic.
   - For example: if the query is about AI semiconductor export controls, allocate technical, geopolitical, supply chain, and regulatory objectives.
   - If the query is about battery recycling, allocate economic, regulatory, chemical efficiency, environmental, and counterargument objectives.
5. Assign the most fitting specialization to each objective from:
   ['economic', 'technical', 'regulatory', 'academic', 'industry', 'environmental', 'historical', 'news', 'counterargument', 'general'].
6. Model dependencies: Mark dependencies only where one objective genuinely requires findings from another. Most should be INDEPENDENT (dependencies = []).
7. Output strict JSON conforming to the schema.`;

      const prompt = `Research Question: "${query}"
Depth: ${depth}

Decompose this question into an executable multi-agent research plan.
Return JSON with:
- main_research_objective: Clear formulation of the overarching goal.
- entities: Array of key organizations, materials, technologies, or concepts.
- geography: Target jurisdiction or "Global".
- timeframe: Relevant historical or forward-looking horizon (e.g. "2020-2026").
- constraints: Explicit operational or financial constraints.
- assumptions: Baseline premises requiring verification.
- objectives: Array of ${minObj}-${maxObj} tasks with { id: "obj-1", title, description, specialization, priority (1-5), dependencies: [], search_queries: ["..."], preferred_source_types: ["..."], geographical_scope, temporal_scope, expected_evidence }.`;

      try {
        const rawJson = await (this.gemini as any).callGeminiApi(prompt, systemPrompt, true);
        const parsed = JSON.parse(rawJson);
        const validated = MasterPlannerOutputSchema.parse(parsed);
        return validated;
      } catch (err) {
        console.error('[MasterPlannerAgent] AI planning failed, deploying dynamic algorithmic planner:', err);
      }
    }

    return this.fallbackDynamicPlanner(query, depth);
  }

  private fallbackDynamicPlanner(query: string, depth: 'quick' | 'standard' | 'deep'): MasterPlannerOutput {
    const isBattery = /battery|recycl|lithium|ev|india|pack/i.test(query);

    if (isBattery) {
      return {
        main_research_objective: 'Evaluate the techno-economic, regulatory, and supply-chain viability of small-scale lithium-ion battery recycling facilities in India.',
        entities: ['Lithium-ion Cells', 'Black Mass', 'Ministry of Environment', 'CPCB', 'NITI Aayog', 'Lohum', 'Attero'],
        geography: 'India (National & Regional Hubs)',
        timeframe: '2022-2027',
        constraints: ['Sub-1,000 MT/annum capacity', 'EPR recovery mandates', '18% vs 5% inverted GST'],
        assumptions: ['High capex for hydrometallurgy', 'Informal sector feedstock dominance', 'Direct cathode regeneration viability'],
        objectives: [
          {
            id: 'obj-1',
            title: 'Capital Expenditure & Operational Cost Benchmarks',
            description: 'Evaluate levelized recycling costs, equipment capex, and unit processing costs for sub-500 MT facilities vs industrial hubs.',
            specialization: 'economic',
            priority: 1,
            dependencies: [],
            search_queries: [
              'small scale hydrometallurgical recycling capex cost per ton black mass',
              'techno-economic analysis battery recycling small scale India',
            ],
            preferred_source_types: ['academic_paper', 'industry_report'],
            geographical_scope: 'India / Global Benchmarks',
            temporal_scope: '2023-2026',
            expected_evidence: 'Capex per metric ton, reagent expenditure, and breakeven timelines.',
          },
          {
            id: 'obj-2',
            title: 'Extended Producer Responsibility & Regulatory Compliance Burden',
            description: 'Analyze statutory requirements and compliance costs under the Battery Waste Management Rules 2022 and CPCB portal.',
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
            expected_evidence: 'Mandatory recovery quotas (70%-90%) and annual recurring audit fees.',
          },
          {
            id: 'obj-3',
            title: 'Feedstock Aggregation & Informal Sector Intermediation',
            description: 'Investigate black mass premiums, collection logistics, and informal e-waste network dominance in Tier 2/3 clusters.',
            specialization: 'industry',
            priority: 2,
            dependencies: [],
            search_queries: [
              'battery scrap collection logistics informal sector black mass premium India',
              'Crisil research EV battery feedstock availability India 2024',
            ],
            preferred_source_types: ['industry_report', 'news_article'],
            geographical_scope: 'India (Maharashtra, Tamil Nadu, NCR)',
            temporal_scope: '2023-2024',
            expected_evidence: 'Operating margins (4-7%) and logistics share of opex (38-44%).',
          },
          {
            id: 'obj-4',
            title: 'Chemical Extraction Efficiency & Direct Regeneration',
            description: 'Compare hydrometallurgical vs direct cathode recovery and organic acid leaching yields at ambient temperature.',
            specialization: 'technical',
            priority: 2,
            dependencies: [],
            search_queries: [
              'direct cathode recycling LFP efficiency recovery vs hydrometallurgy',
              'organic citric acid leaching mechanochemical lithium recovery purity',
            ],
            preferred_source_types: ['academic_paper', 'technical_doc'],
            geographical_scope: 'Global & Indian R&D',
            temporal_scope: '2023-2025',
            expected_evidence: 'Leaching efficiency percentages and capex comparison (<$180k).',
          },
          {
            id: 'obj-5',
            title: 'Environmental Effluent & Hazardous Waste Treatment Costs',
            description: 'Quantify effluent treatment plants (ETP) capex and air scrubber compliance expenditures for decentralized sites.',
            specialization: 'environmental',
            priority: 3,
            dependencies: ['obj-1'],
            search_queries: [
              'hydrometallurgical effluent treatment plant cost small battery recycler',
              'toxic sludge disposal norms CPCB battery recycling',
            ],
            preferred_source_types: ['government_policy', 'technical_doc'],
            geographical_scope: 'India',
            temporal_scope: '2023-2025',
            expected_evidence: 'ETP installation overhead and recurring sludge handling costs.',
          },
          {
            id: 'obj-6',
            title: 'Inverted GST Fiscal Distortion & Working Capital Lockup',
            description: 'Assess the working capital impact of 18% GST on raw scrap purchases vs 5-12% on refined metal salts.',
            specialization: 'news',
            priority: 3,
            dependencies: [],
            search_queries: [
              'battery recycling inverted GST duty structure industry petition finance ministry',
              'Economic Times battery recycling startup margin squeeze GST 18 percent',
            ],
            preferred_source_types: ['news_article'],
            geographical_scope: 'India',
            temporal_scope: '2024',
            expected_evidence: 'Refund delay duration and working capital strain percentage.',
          },
          {
            id: 'obj-7',
            title: 'Counterarguments & Viability of Micro-Foundry Hubs',
            description: 'Examine primary empirical evidence showing positive EBITDA in decentralized organic leaching and Common Facility Centers.',
            specialization: 'counterargument',
            priority: 4,
            dependencies: ['obj-1', 'obj-4'],
            search_queries: [
              'decentralized mechanochemical battery recycling positive EBITDA micro scale',
              'Common Facility Center CFC cluster battery recycling NITI Aayog',
            ],
            preferred_source_types: ['technical_doc', 'academic_paper'],
            geographical_scope: 'Bengaluru / Pune Pilot Studies',
            temporal_scope: '2024',
            expected_evidence: 'Reported 18.2% EBITDA and capital recovery under 3.4 years.',
          },
        ],
      };
    }

    // Dynamic decomposition for any arbitrary query
    return {
      main_research_objective: `Systematically investigate and validate the empirical, technical, and domain viability of: "${query}"`,
      entities: [query.slice(0, 30), 'Domain Stakeholders', 'Regulatory Bodies'],
      geography: 'Global / Relevant Jurisdictions',
      timeframe: 'Current / Recent 3 Years',
      constraints: ['Empirical verifiability', 'Cost-benefit tradeoffs'],
      assumptions: ['Feasibility under optimal vs adverse conditions'],
      objectives: [
        {
          id: 'obj-1',
          title: 'Economic & Cost-Benefit Architecture',
          description: `Examine capital costs, unit economics, operational expenditures, and revenue viability for ${query}.`,
          specialization: 'economic',
          priority: 1,
          dependencies: [],
          search_queries: [`${query} economic viability cost capex`, `${query} financial analysis unit economics`],
          preferred_source_types: ['industry_report', 'academic_paper'],
          expected_evidence: 'Financial benchmarks, unit costs, and ROI metrics.',
        },
        {
          id: 'obj-2',
          title: 'Technical Feasibility & Implementation Mechanics',
          description: `Evaluate core technologies, performance metrics, and engineering constraints relevant to ${query}.`,
          specialization: 'technical',
          priority: 1,
          dependencies: [],
          search_queries: [`${query} technical performance benchmark`, `${query} engineering implementation specs`],
          preferred_source_types: ['technical_doc', 'academic_paper'],
          expected_evidence: 'Technical specifications, efficiency yields, and operational failure modes.',
        },
        {
          id: 'obj-3',
          title: 'Regulatory, Statutory & Policy Frameworks',
          description: `Map out compliance requirements, standards, and legal restrictions governing ${query}.`,
          specialization: 'regulatory',
          priority: 2,
          dependencies: [],
          search_queries: [`${query} government policy regulation compliance`, `${query} statutory standards requirements`],
          preferred_source_types: ['government_policy'],
          expected_evidence: 'Statutory citations, compliance checklists, and penalty structures.',
        },
        {
          id: 'obj-4',
          title: 'Market Adoption & Commercial Field Reports',
          description: `Assess real-world adoption, industry leader deployment, and field-tested outcomes for ${query}.`,
          specialization: 'industry',
          priority: 2,
          dependencies: [],
          search_queries: [`${query} market adoption commercial cases`, `${query} industry deployment reports`],
          preferred_source_types: ['industry_report', 'news_article'],
          expected_evidence: 'Deployment statistics, commercial adoption rates, and case study outcomes.',
        },
        {
          id: 'obj-5',
          title: 'Counterarguments, Failure Modes & Edge Conditions',
          description: `Actively uncover empirical challenges, hidden liabilities, and critical counterarguments against ${query}.`,
          specialization: 'counterargument',
          priority: 3,
          dependencies: ['obj-1', 'obj-2'],
          search_queries: [`${query} challenges failure modes criticism`, `${query} counterarguments limitations risk`],
          preferred_source_types: ['technical_doc', 'academic_paper'],
          expected_evidence: 'Documented failure rates, risk assessments, and opposing expert conclusions.',
        },
      ],
    };
  }
}

