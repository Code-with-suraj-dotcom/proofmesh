'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { RootNode } from './nodes/RootNode';
import { ObjectiveNode } from './nodes/ObjectiveNode';
import { EvidenceNode } from './nodes/EvidenceNode';
import { SourceNode } from './nodes/SourceNode';
import { ContradictionNode } from './nodes/ContradictionNode';
import { EvidenceDetailDrawer } from './EvidenceDetailDrawer';
import { FullEvidenceGraph, EvidenceNodeData } from '@/types/graph';
import { Search, Filter, Sliders, Maximize2, ShieldCheck, Flame, Layers } from 'lucide-react';

const nodeTypes = {
  root_hypothesis: RootNode,
  objective: ObjectiveNode,
  sub_hypothesis: ObjectiveNode,
  evidence: EvidenceNode,
  source: SourceNode,
  contradiction: ContradictionNode,
};

interface Props {
  initialGraph: FullEvidenceGraph;
}

export function EvidenceGraph({ initialGraph }: Props) {
  // Convert API nodes to React Flow format
  const initialReactNodes: Node[] = useMemo(() => {
    return initialGraph.nodes.map((n) => ({
      id: n.id,
      type: n.node_type,
      position: { x: Number(n.position_x) || 0, y: Number(n.position_y) || 0 },
      data: n.metadata as unknown as Record<string, unknown>,
    }));
  }, [initialGraph]);

  // Convert API edges to React Flow format
  const initialReactEdges: Edge[] = useMemo(() => {
    return initialGraph.edges.map((e) => {
      const isContradicts = e.relationship_type === 'CONTRADICTS';
      const isSupports = e.relationship_type === 'SUPPORTS';

      return {
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        label: e.label,
        type: 'smoothstep',
        animated: isSupports || isContradicts,
        style: {
          stroke: isContradicts ? '#EF4444' : isSupports ? '#20B77A' : '#8994A8',
          strokeWidth: isContradicts ? 2.5 : 1.8,
          strokeDasharray: isContradicts ? '4,4' : undefined,
        },
        labelStyle: {
          fill: '#8994A8',
          fontSize: 10,
          fontFamily: 'monospace',
        },
        labelBgStyle: {
          fill: '#080B12',
          fillOpacity: 0.8,
        },
      };
    });
  }, [initialGraph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialReactNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialReactEdges);

  // Synchronize state whenever initialGraph prop changes (e.g., dynamic updates after fetch)
  React.useEffect(() => {
    setNodes(initialReactNodes);
    setEdges(initialReactEdges);
  }, [initialReactNodes, initialReactEdges, setNodes, setEdges]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [minConfidence, setMinConfidence] = useState<number>(50);
  const [selectedNodeData, setSelectedNodeData] = useState<EvidenceNodeData | null>(null);

  // Filtered nodes based on search and filters
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const data = n.data as unknown as EvidenceNodeData;
      // Search text match
      const label = (data.claimText || data.title || data.label || '').toLowerCase();
      if (searchQuery && !label.includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Node type filter
      if (selectedType !== 'all' && n.type !== selectedType) {
        return false;
      }
      // Confidence slider filter for evidence nodes
      if (n.type === 'evidence' && data.confidence) {
        if (data.confidence * 100 < minConfidence) {
          return false;
        }
      }
      return true;
    });
  }, [nodes, searchQuery, selectedType, minConfidence]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeData(node.data as unknown as EvidenceNodeData);
  }, []);

  return (
    <div className="relative w-full h-[700px] rounded-2xl border border-white/[0.08] bg-[#080B12] overflow-hidden shadow-2xl">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Search Input */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#101522]/90 backdrop-blur-md border border-white/[0.08] rounded-xl px-3 py-1.5 shadow-lg">
          <Search className="w-4 h-4 text-[#8994A8]" />
          <input
            type="text"
            placeholder="Search claims, topics, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-[#F5F7FB] placeholder-[#5A6478] focus:outline-none w-48 sm:w-64"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-[#101522]/90 backdrop-blur-md border border-white/[0.08] rounded-xl p-1.5 shadow-lg text-xs">
          {/* Node Type Selector */}
          <div className="flex items-center gap-1 border-r border-white/[0.08] pr-2 mr-1">
            <Filter className="w-3.5 h-3.5 text-[#8994A8] ml-1" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-xs text-[#F5F7FB] focus:outline-none pr-1"
            >
              <option value="all" className="bg-[#101522]">All Node Types</option>
              <option value="objective" className="bg-[#101522]">Objectives</option>
              <option value="evidence" className="bg-[#101522]">Evidence Claims</option>
              <option value="contradiction" className="bg-[#101522]">Contradictions</option>
              <option value="source" className="bg-[#101522]">Sources</option>
            </select>
          </div>

          {/* Confidence Slider */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-mono text-[#8994A8]">Conf: ≥{minConfidence}%</span>
            <input
              type="range"
              min="30"
              max="95"
              step="5"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-16 sm:w-20 accent-[#3678F6] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.8}
        className="bg-[#080B12]"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#1e293b"
        />
        <Controls className="!bg-[#101522] !border-white/[0.1] !rounded-lg overflow-hidden !shadow-xl [&>button]:!bg-[#151C2B] [&>button]:!border-white/[0.08] [&>button]:!text-[#8994A8] hover:[&>button]:!text-white" />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'root_hypothesis':
                return '#3678F6';
              case 'objective':
              case 'sub_hypothesis':
                return '#38bdf8';
              case 'evidence':
                return '#20B77A';
              case 'contradiction':
                return '#EF4444';
              case 'source':
                return '#64748b';
              default:
                return '#334155';
            }
          }}
          className="!bg-[#101522]/90 !border-white/[0.1] !rounded-xl overflow-hidden !shadow-lg"
          maskColor="rgba(8, 11, 18, 0.7)"
        />
      </ReactFlow>

      {/* Node Inspector Drawer */}
      <EvidenceDetailDrawer
        data={selectedNodeData}
        onClose={() => setSelectedNodeData(null)}
      />
    </div>
  );
}

