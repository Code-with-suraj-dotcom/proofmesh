export type EvidenceNodeType =
  | 'root_hypothesis'
  | 'objective'
  | 'sub_hypothesis'
  | 'evidence'
  | 'source'
  | 'contradiction'
  | 'verification';

export type EvidenceRelationshipType =
  | 'SUPPORTS'
  | 'CONTRADICTS'
  | 'DERIVED_FROM'
  | 'REFERENCES'
  | 'RELATED_TO'
  | 'VERIFIES';

export interface EvidenceNodeData {
  [key: string]: unknown;
  label: string;
  nodeType: EvidenceNodeType;
  referenceId?: string;
  title?: string;
  specialization?: string;
  claimText?: string;
  originalPassage?: string;
  sourceUrl?: string;
  sourceDomain?: string;
  sourceTitle?: string;
  confidence?: number;
  confidenceRationale?: string;
  stance?: 'supports' | 'contradicts' | 'neutral';
  status?: string;
  publicationDate?: string;
  retrievedAt?: string;
  contradictionType?: string;
  severity?: string;
  explanation?: string;
  claimAId?: string;
  claimBId?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphNode {
  id: string;
  research_id: string;
  node_type: EvidenceNodeType;
  reference_id?: string;
  label: string;
  metadata: EvidenceNodeData;
  position_x: number;
  position_y: number;
}

export interface GraphEdge {
  id: string;
  research_id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: EvidenceRelationshipType;
  label?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface FullEvidenceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
