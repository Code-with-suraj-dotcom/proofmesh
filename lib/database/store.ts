import fs from 'fs';
import path from 'path';
import {
  ResearchSession,
  ResearchEvent,
  ResearchReport,
  ResearchCounters,
} from '@/types/research';
import { Source, Claim, Contradiction } from '@/types/evidence';
import {
  ResearchAgentTask,
  ResearchObjective,
  WebsiteTask,
} from '@/types/agents';
import { GraphNode, GraphEdge, FullEvidenceGraph } from '@/types/graph';
import { getSupabaseClient } from './supabase';

interface InMemoryData {
  sessions: Record<string, ResearchSession>;
  objectives: Record<string, ResearchObjective[]>;
  agents: Record<string, ResearchAgentTask[]>;
  websiteTasks: Record<string, WebsiteTask[]>;
  sources: Record<string, Source[]>;
  claims: Record<string, Claim[]>;
  contradictions: Record<string, Contradiction[]>;
  nodes: Record<string, GraphNode[]>;
  edges: Record<string, GraphEdge[]>;
  reports: Record<string, ResearchReport>;
  events: Record<string, ResearchEvent[]>;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'proofmesh.json');

class ResearchRepository {
  private memoryData: InMemoryData;

  constructor() {
    this.memoryData = {
      sessions: {},
      objectives: {},
      agents: {},
      websiteTasks: {},
      sources: {},
      claims: {},
      contradictions: {},
      nodes: {},
      edges: {},
      reports: {},
      events: {},
    };
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.memoryData = { ...this.memoryData, ...parsed };
      }
    } catch (err) {
      console.warn('[Repository] Failed to read .data/proofmesh.json:', err);
    }
  }

  private persistToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.memoryData, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[Repository] Failed to persist to .data/proofmesh.json:', err);
    }
  }

  // --- SESSIONS ---
  async createSession(session: ResearchSession): Promise<ResearchSession> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('research_sessions')
        .insert({
          id: session.id,
          user_id: session.user_id,
          query: session.query,
          depth: session.depth,
          status: session.status,
          total_objectives: session.total_objectives || 0,
          completed_objectives: session.completed_objectives || 0,
          total_agents: session.total_agents || 0,
          active_agents: session.active_agents || 0,
          total_website_tasks: session.total_website_tasks || 0,
          completed_website_tasks: session.completed_website_tasks || 0,
          failed_website_tasks: session.failed_website_tasks || 0,
          sources_discovered: session.sources_discovered || 0,
          claims_extracted: session.claims_extracted || 0,
          created_at: session.created_at,
          metadata: session.metadata || {},
        })
        .select()
        .single();
      if (!error && data) {
        this.memoryData.sessions[session.id] = session;
        this.persistToDisk();
        return data as ResearchSession;
      }
    }

    this.memoryData.sessions[session.id] = session;
    this.persistToDisk();
    return session;
  }

  async getSession(id: string): Promise<ResearchSession | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.from('research_sessions').select('*').eq('id', id).single();
      if (data) return data as ResearchSession;
    }
    return this.memoryData.sessions[id] || null;
  }

  async listSessions(): Promise<ResearchSession[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from('research_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) return data as ResearchSession[];
    }
    return Object.values(this.memoryData.sessions).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async updateSession(id: string, updates: Partial<ResearchSession>): Promise<ResearchSession | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('research_sessions').update(updates).eq('id', id);
    }

    if (this.memoryData.sessions[id]) {
      this.memoryData.sessions[id] = { ...this.memoryData.sessions[id], ...updates };
      this.persistToDisk();
      return this.memoryData.sessions[id];
    }
    return null;
  }

  // --- RESEARCH OBJECTIVES ---
  async saveObjectives(researchId: string, objectives: ResearchObjective[]): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('research_objectives').insert(
        objectives.map((o) => ({
          id: o.id,
          research_id: researchId,
          parent_objective_id: o.parent_objective_id,
          title: o.title,
          description: o.description,
          specialization: o.specialization,
          priority: o.priority,
          dependencies: o.dependencies,
          search_queries: o.search_queries,
          preferred_source_types: o.preferred_source_types,
          geographical_scope: o.geographical_scope,
          temporal_scope: o.temporal_scope,
          expected_evidence: o.expected_evidence,
          status: o.status,
          created_at: o.created_at,
        }))
      );
    }
    this.memoryData.objectives[researchId] = [
      ...(this.memoryData.objectives[researchId] || []),
      ...objectives,
    ];
    this.persistToDisk();
  }

  async updateObjective(
    researchId: string,
    objectiveId: string,
    updates: Partial<ResearchObjective>
  ): Promise<void> {
    const list = this.memoryData.objectives[researchId] || [];
    const idx = list.findIndex((o) => o.id === objectiveId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.memoryData.objectives[researchId] = list;
      this.persistToDisk();
    }
  }

  async getObjectives(researchId: string): Promise<ResearchObjective[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from('research_objectives')
        .select('*')
        .eq('research_id', researchId)
        .order('priority', { ascending: true });
      if (data && data.length > 0) return data as ResearchObjective[];
    }
    return this.memoryData.objectives[researchId] || [];
  }

  // --- RESEARCH AGENTS ---
  async saveAgents(researchId: string, agents: ResearchAgentTask[]): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('research_agents').upsert(
        agents.map((a) => ({
          id: a.id,
          research_id: researchId,
          objective_id: a.objective_id,
          specialization: a.specialization,
          name: a.name,
          description: a.description,
          status: a.status,
          progress: a.progress,
          websites_dispatched: a.websites_dispatched || 0,
          websites_succeeded: a.websites_succeeded || 0,
          websites_failed: a.websites_failed || 0,
          sources_found: a.sources_found || 0,
          claims_extracted: a.claims_extracted || 0,
          started_at: a.started_at,
          completed_at: a.completed_at,
        }))
      );
    }
    this.memoryData.agents[researchId] = [
      ...(this.memoryData.agents[researchId] || []),
      ...agents,
    ];
    this.persistToDisk();
  }

  async updateAgent(
    researchId: string,
    agentId: string,
    updates: Partial<ResearchAgentTask>
  ): Promise<void> {
    const list = this.memoryData.agents[researchId] || [];
    const idx = list.findIndex((a) => a.id === agentId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.memoryData.agents[researchId] = list;
      this.persistToDisk();
    }
  }

  async getAgents(researchId: string): Promise<ResearchAgentTask[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.from('research_agents').select('*').eq('research_id', researchId);
      if (data && data.length > 0) return data as ResearchAgentTask[];
    }
    return this.memoryData.agents[researchId] || [];
  }

  // --- WEBSITE TASKS ---
  async saveWebsiteTasks(researchId: string, tasks: WebsiteTask[]): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('website_tasks').insert(
        tasks.map((t) => ({
          id: t.id,
          research_id: researchId,
          agent_id: t.agent_id,
          objective_id: t.objective_id,
          url: t.url,
          goal: t.goal,
          status: t.status,
          retry_count: t.retry_count,
          max_retries: t.max_retries,
          execution_duration_ms: t.execution_duration_ms,
          error_message: t.error_message,
          error_type: t.error_type,
          started_at: t.started_at,
          completed_at: t.completed_at,
          created_at: t.created_at,
        }))
      );
    }
    this.memoryData.websiteTasks[researchId] = [
      ...(this.memoryData.websiteTasks[researchId] || []),
      ...tasks,
    ];
    this.persistToDisk();
  }

  async updateWebsiteTask(
    researchId: string,
    taskId: string,
    updates: Partial<WebsiteTask>
  ): Promise<void> {
    const list = this.memoryData.websiteTasks[researchId] || [];
    const idx = list.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.memoryData.websiteTasks[researchId] = list;
      this.persistToDisk();
    }
  }

  async getWebsiteTasks(researchId: string, agentId?: string): Promise<WebsiteTask[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('website_tasks').select('*').eq('research_id', researchId);
      if (agentId) query = query.eq('agent_id', agentId);
      const { data } = await query.order('created_at', { ascending: true });
      if (data && data.length > 0) return data as WebsiteTask[];
    }
    const all = this.memoryData.websiteTasks[researchId] || [];
    return agentId ? all.filter((t) => t.agent_id === agentId) : all;
  }

  // --- SOURCES ---
  async saveSources(researchId: string, sources: Source[]): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('sources').insert(
        sources.map((s) => ({
          id: s.id,
          research_id: researchId,
          agent_id: s.agent_id,
          website_task_id: s.website_task_id,
          title: s.title,
          url: s.url,
          domain: s.domain,
          source_type: s.source_type,
          publication_date: s.publication_date,
          retrieved_at: s.retrieved_at,
          credibility_assessment: s.credibility_assessment || {},
          content_snippet: s.content_snippet,
          verification_status: s.verification_status,
        }))
      );
    }
    this.memoryData.sources[researchId] = [
      ...(this.memoryData.sources[researchId] || []),
      ...sources,
    ];
    this.persistToDisk();
  }

  async getSources(researchId: string): Promise<Source[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.from('sources').select('*').eq('research_id', researchId);
      if (data && data.length > 0) return data as Source[];
    }
    return this.memoryData.sources[researchId] || [];
  }

  // --- CLAIMS ---
  async saveClaims(researchId: string, claims: Claim[]): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('claims').insert(
        claims.map((c) => ({
          id: c.id,
          research_id: researchId,
          objective_id: c.objective_id,
          source_id: c.source_id,
          agent_id: c.agent_id,
          claim_text: c.claim_text,
          original_passage: c.original_passage,
          stance: c.stance,
          evidence_type: c.evidence_type,
          confidence: c.confidence,
          confidence_rationale: c.confidence_rationale,
          is_direct_evidence: c.is_direct_evidence,
          verification_status: c.verification_status,
          created_at: c.created_at,
        }))
      );
    }
    this.memoryData.claims[researchId] = [
      ...(this.memoryData.claims[researchId] || []),
      ...claims,
    ];
    this.persistToDisk();
  }

  async getClaims(researchId: string): Promise<Claim[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.from('claims').select('*').eq('research_id', researchId);
      if (data && data.length > 0) return data as Claim[];
    }
    return this.memoryData.claims[researchId] || [];
  }

  // --- CONTRADICTIONS ---
  async saveContradictions(researchId: string, contradictions: Contradiction[]): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('contradictions').insert(
        contradictions.map((c) => ({
          id: c.id,
          research_id: researchId,
          claim_a_id: c.claim_a_id,
          claim_b_id: c.claim_b_id,
          explanation: c.explanation,
          contradiction_type: c.contradiction_type,
          severity: c.severity,
          resolution_status: c.resolution_status,
          adaptive_verification_dispatched: c.adaptive_verification_dispatched || false,
          created_at: c.created_at,
        }))
      );
    }
    this.memoryData.contradictions[researchId] = [
      ...(this.memoryData.contradictions[researchId] || []),
      ...contradictions,
    ];
    this.persistToDisk();
  }

  async getContradictions(researchId: string): Promise<Contradiction[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.from('contradictions').select('*').eq('research_id', researchId);
      if (data && data.length > 0) return data as Contradiction[];
    }
    return this.memoryData.contradictions[researchId] || [];
  }

  // --- EVIDENCE GRAPH ---
  async saveEvidenceGraph(
    researchId: string,
    nodes: GraphNode[],
    edges: GraphEdge[]
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('evidence_nodes').insert(
          nodes.map((n) => ({
            id: n.id,
            research_id: researchId,
            node_type: n.node_type,
            reference_id: n.reference_id,
            label: n.label,
            metadata: n.metadata,
            position_x: n.position_x,
            position_y: n.position_y,
          }))
        );
        await supabase.from('evidence_edges').insert(
          edges.map((e) => ({
            id: e.id,
            research_id: researchId,
            source_node_id: e.source_node_id,
            target_node_id: e.target_node_id,
            relationship_type: e.relationship_type,
            label: e.label,
            confidence: e.confidence,
            metadata: e.metadata || {},
          }))
        );
      } catch (err) {
        console.warn('[Repository] Supabase graph save notice (persisting locally):', err);
      }
    }
    this.memoryData.nodes[researchId] = nodes;
    this.memoryData.edges[researchId] = edges;
    this.persistToDisk();
  }

  async getEvidenceGraph(researchId: string): Promise<FullEvidenceGraph> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: nodes } = await supabase
          .from('evidence_nodes')
          .select('*')
          .eq('research_id', researchId);
        const { data: edges } = await supabase
          .from('evidence_edges')
          .select('*')
          .eq('research_id', researchId);
        if (nodes && nodes.length > 0) {
          return {
            nodes: nodes as GraphNode[],
            edges: (edges || []) as GraphEdge[],
          };
        }
      } catch {
        // Fall through to local durable store
      }
    }

    this.loadFromDisk();
    const localNodes = this.memoryData.nodes[researchId] || [];
    const localEdges = this.memoryData.edges[researchId] || [];

    if (localNodes.length > 0) {
      return {
        nodes: localNodes,
        edges: localEdges,
      };
    }

    // Dynamic Graph Synthesis: If nodes were not pre-calculated, synthesize topology on the fly
    const session = await this.getSession(researchId);
    const objectives = await this.getObjectives(researchId);
    const claims = await this.getClaims(researchId);
    const sources = await this.getSources(researchId);
    const contradictions = await this.getContradictions(researchId);

    if (session || objectives.length > 0 || claims.length > 0) {
      const synthesized = this.synthesizeEvidenceGraph(
        researchId,
        session?.query || 'Research Objective',
        objectives,
        claims,
        sources,
        contradictions
      );
      if (synthesized.nodes.length > 0) {
        this.memoryData.nodes[researchId] = synthesized.nodes;
        this.memoryData.edges[researchId] = synthesized.edges;
        this.persistToDisk();
        return synthesized;
      }
    }

    return {
      nodes: [],
      edges: [],
    };
  }

  synthesizeEvidenceGraph(
    researchId: string,
    query: string,
    objectives: ResearchObjective[],
    claims: Claim[],
    sources: Source[],
    contradictions: Contradiction[]
  ): FullEvidenceGraph {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // 1. Root Hypothesis Node
    const rootNodeId = `node-root-${researchId}`;
    nodes.push({
      id: rootNodeId,
      research_id: researchId,
      node_type: 'root_hypothesis',
      label: query,
      metadata: {
        label: query,
        nodeType: 'root_hypothesis',
        title: 'Primary Research Objective',
        status: 'investigated',
      },
      position_x: 650,
      position_y: 40,
    });

    // 2. Objective Nodes
    const objNodeMap = new Map<string, string>();
    const objSpacing = 300;
    const startX = 650 - ((objectives.length - 1) * objSpacing) / 2;

    objectives.forEach((obj, idx) => {
      const oNodeId = `node-obj-${obj.id}`;
      objNodeMap.set(obj.id, oNodeId);

      nodes.push({
        id: oNodeId,
        research_id: researchId,
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

      edges.push({
        id: `edge-root-obj-${obj.id}`,
        research_id: researchId,
        source_node_id: rootNodeId,
        target_node_id: oNodeId,
        relationship_type: 'DERIVED_FROM',
        label: 'DERIVED_FROM',
      });
    });

    // 3. Claim Nodes
    const claimNodeMap = new Map<string, string>();
    claims.forEach((claim, idx) => {
      const cNodeId = `node-claim-${claim.id}`;
      claimNodeMap.set(claim.id, cNodeId);

      const parentObjNode = claim.objective_id ? objNodeMap.get(claim.objective_id) : null;
      const parentObj = nodes.find((n) => n.id === parentObjNode);
      const posX = parentObj ? parentObj.position_x + ((idx % 2 === 0 ? -1 : 1) * 35) : 300 + (idx % 5) * 260;
      const posY = 460 + Math.floor(idx / 5) * 160;

      nodes.push({
        id: cNodeId,
        research_id: researchId,
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

      if (parentObjNode) {
        edges.push({
          id: `edge-claim-${claim.id}`,
          research_id: researchId,
          source_node_id: cNodeId,
          target_node_id: parentObjNode,
          relationship_type: claim.stance === 'contradicts' ? 'CONTRADICTS' : 'SUPPORTS',
          label: claim.stance === 'contradicts' ? 'CONTRADICTS' : 'SUPPORTS',
          confidence: claim.confidence,
        });
      }
    });

    // 4. Source Nodes
    const sourceNodeMap = new Map<string, string>();
    sources.forEach((src, idx) => {
      const sNodeId = `node-src-${src.id}`;
      sourceNodeMap.set(src.id, sNodeId);

      nodes.push({
        id: sNodeId,
        research_id: researchId,
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

    claims.forEach((claim) => {
      const cNodeId = claimNodeMap.get(claim.id);
      const sNodeId = sourceNodeMap.get(claim.source_id);
      if (cNodeId && sNodeId) {
        edges.push({
          id: `edge-ref-${claim.id}`,
          research_id: researchId,
          source_node_id: sNodeId,
          target_node_id: cNodeId,
          relationship_type: 'REFERENCES',
          label: 'REFERENCES',
        });
      }
    });

    // 5. Contradiction Nodes
    contradictions.forEach((ct) => {
      const ctNodeId = `node-ct-${ct.id}`;
      const nodeAId = claimNodeMap.get(ct.claim_a_id);
      const nodeBId = claimNodeMap.get(ct.claim_b_id);

      const posA = nodes.find((n) => n.id === nodeAId);
      const posB = nodes.find((n) => n.id === nodeBId);
      const midX = posA && posB ? (posA.position_x + posB.position_x) / 2 : 650;
      const midY = posA && posB ? (posA.position_y + posB.position_y) / 2 : 600;

      nodes.push({
        id: ctNodeId,
        research_id: researchId,
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
          research_id: researchId,
          source_node_id: ctNodeId,
          target_node_id: nodeAId,
          relationship_type: 'CONTRADICTS',
          label: 'CONTRADICTS',
        });
      }
      if (nodeBId) {
        edges.push({
          id: `edge-ct-b-${ct.id}`,
          research_id: researchId,
          source_node_id: ctNodeId,
          target_node_id: nodeBId,
          relationship_type: 'CONTRADICTS',
          label: 'CONTRADICTS',
        });
      }
    });

    return { nodes, edges };
  }

  // --- REPORT ---
  async saveReport(researchId: string, report: ResearchReport): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('research_reports').upsert({
        id: report.id,
        research_id: researchId,
        executive_summary: report.executive_summary,
        content_markdown: report.content_markdown,
        sections: report.sections,
        coverage_status: report.coverage_status,
        format: report.format,
        generated_at: report.generated_at,
      });
    }
    this.memoryData.reports[researchId] = report;
    this.persistToDisk();
  }

  async getReport(researchId: string): Promise<ResearchReport | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from('research_reports')
        .select('*')
        .eq('research_id', researchId)
        .single();
      if (data) return data as ResearchReport;
    }
    return this.memoryData.reports[researchId] || null;
  }

  // --- EVENTS ---
  async addEvent(event: ResearchEvent): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('research_events').insert({
        id: event.id,
        research_id: event.research_id,
        event_type: event.event_type,
        stage: event.stage,
        message: event.message,
        metadata: event.metadata || {},
        created_at: event.created_at,
      });
    }
    if (!this.memoryData.events[event.research_id]) {
      this.memoryData.events[event.research_id] = [];
    }
    this.memoryData.events[event.research_id].push(event);
    this.persistToDisk();
  }

  async saveEvent(event: ResearchEvent): Promise<void> {
    return this.addEvent(event);
  }

  async getEvents(researchId: string): Promise<ResearchEvent[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from('research_events')
        .select('*')
        .eq('research_id', researchId)
        .order('created_at', { ascending: true });
      if (data && data.length > 0) return data as ResearchEvent[];
    }
    return this.memoryData.events[researchId] || [];
  }
}

export const repository = new ResearchRepository();
