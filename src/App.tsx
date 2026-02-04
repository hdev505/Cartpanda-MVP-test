import { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
  ReactFlowProvider,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { nodeTypes, NodeActionsContext } from './nodes';
import { edgeTypes, EdgeActionsContext } from './edges';
import { Palette, getPaletteNodeData } from './components/Palette';
import { Toolbar } from './components/Toolbar';
import { useFunnelValidation } from './hooks/useFunnelValidation';
import {
  loadFunnel,
  saveFunnel,
  exportFunnelJson,
  parseFunnelJson,
  getNextLabel,
} from './store';
import type { FunnelNodeData, NodeKind } from './types';

const INITIAL_NODES: Node<FunnelNodeData>[] = [];
const INITIAL_EDGES: Edge[] = [];

/** Ref populated by a child of ReactFlow so we can convert drop coords to flow space */
const screenToFlowPositionRef = { current: null as ((pos: { x: number; y: number }) => { x: number; y: number }) | null };

function FlowPositionRefSetter() {
  const { screenToFlowPosition } = useReactFlow();
  useEffect(() => {
    screenToFlowPositionRef.current = screenToFlowPosition;
    return () => {
      screenToFlowPositionRef.current = null;
    };
  }, [screenToFlowPosition]);
  return null;
}

function FunnelBuilderInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);

  const { messages, invalidOutgoingNodeIds } = useFunnelValidation(
    nodes,
    edges
  );

  const nodesWithValidation = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          invalidOutgoing: invalidOutgoingNodeIds.has(n.id),
        },
      })),
    [nodes, invalidOutgoingNodeIds]
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'funnelEdge',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: 'var(--color-edge, #64748b)', strokeWidth: 2 },
          },
          eds
        )
      ),
    [setEdges]
  );

  const edgeActions = useMemo(
    () => ({
      deleteEdge: (edgeId: string) =>
        setEdges((eds) => eds.filter((e) => e.id !== edgeId)),
    }),
    [setEdges]
  );

  const nodeActions = useMemo(
    () => ({
      deleteNode: (nodeId: string) => {
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) =>
          eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
        );
      },
    }),
    [setNodes, setEdges]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const kind = e.dataTransfer.getData(
        'application/reactflow-node-kind'
      ) as NodeKind | '';
      if (!kind) return;

      const toFlow = screenToFlowPositionRef.current;
      const position = toFlow
        ? toFlow({ x: e.clientX, y: e.clientY })
        : { x: e.clientX - 100, y: e.clientY - 50 };

      let title = getPaletteNodeData(kind as NodeKind).title;
      if (kind === 'upsell' || kind === 'downsell') {
        title = getNextLabel(kind, nodes);
      }

      const newNode: Node<FunnelNodeData> = {
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: 'funnelNode',
        position,
        data: {
          kind: kind as NodeKind,
          title,
          buttonLabel: getPaletteNodeData(kind as NodeKind).buttonLabel,
        },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [nodes, setNodes]
  );

  useEffect(() => {
    const saved = loadFunnel();
    if (saved?.nodes?.length) {
      setNodes(
        saved.nodes.map((n) => ({
          id: n.id,
          type: (n.type as 'funnelNode') || 'funnelNode',
          position: n.position,
          data: n.data,
        }))
      );
      setEdges(
        saved.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'funnelEdge',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: 'var(--color-edge, #64748b)', strokeWidth: 2 },
        }))
      );
    }
  }, []);

  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      saveFunnel(nodes, edges);
    }
  }, [nodes, edges]);

  const handleExport = useCallback(() => {
    const json = exportFunnelJson(nodes, edges);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'funnel.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleImport = useCallback(
    (json: string) => {
      const state = parseFunnelJson(json);
      if (!state) return;
      setNodes(
        state.nodes.map((n) => ({
          id: n.id,
          type: (n.type as 'funnelNode') || 'funnelNode',
          position: n.position,
          data: n.data,
        }))
      );
      setEdges(
        state.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'funnelEdge',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: 'var(--color-edge, #64748b)', strokeWidth: 2 },
        }))
      );
    },
    [setNodes, setEdges]
  );

  const handleClear = useCallback(() => {
    const hasContent = nodes.length > 0 || edges.length > 0;
    if (!hasContent || window.confirm('Clear the entire funnel? This cannot be undone.')) {
      setNodes([]);
      setEdges([]);
      localStorage.removeItem('cartpanda-funnel');
    }
  }, [nodes.length, edges.length, setNodes, setEdges]);

  return (
    <div className="flex h-screen flex-col bg-[var(--color-canvas)]">
      <a
        href="#toolbar"
        className="absolute left-3 top-3 z-50 -translate-y-14 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
      >
        Skip to toolbar
      </a>
      <Toolbar
        onExport={handleExport}
        onImport={handleImport}
        onClear={handleClear}
        validationMessages={messages}
      />
      <div className="flex flex-1 min-h-0">
        <Palette />
        <div ref={reactFlowWrapper} className="flex-1">
          <EdgeActionsContext.Provider value={edgeActions}>
            <NodeActionsContext.Provider value={nodeActions}>
            <ReactFlow
              nodes={nodesWithValidation}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDragOver={onDragOver}
              onDrop={onDrop}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              deleteKeyCode={['Backspace', 'Delete']}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              defaultEdgeOptions={{
                type: 'funnelEdge',
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { stroke: 'var(--color-edge, #64748b)', strokeWidth: 2 },
                deletable: true,
              }}
              connectionLineType={undefined}
              snapToGrid
              snapGrid={[16, 16]}
              minZoom={0.2}
              maxZoom={1.5}
              proOptions={{ hideAttribution: true }}
              aria-label="Funnel canvas"
            >
            <Background gap={20} size={1} className="!bg-[var(--color-canvas)]" />
            <Controls
              className="!shadow-md"
              showInteractive={false}
              aria-label="Canvas controls"
            />
            <MiniMap
              className="!rounded-lg !shadow-md"
              aria-label="Minimap"
            />
            <Panel position="top-center" className="m-3">
              <p className="rounded-xl bg-[var(--color-surface)]/95 px-4 py-2 text-sm text-[var(--color-muted)] shadow-[var(--shadow-sm)] border border-[var(--color-border)]">
                Drag nodes from the palette onto the canvas. Connect with arrows by dragging from a node’s bottom handle to another’s top handle. Use the delete button on each node or edge to remove it, or select and press <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">Delete</kbd>.
              </p>
            </Panel>
            {nodes.length === 0 && (
              <Panel position="top-center" className="m-3 mt-20">
                <div
                  className="rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/90 px-10 py-8 text-center shadow-[var(--shadow-sm)]"
                  role="status"
                  aria-live="polite"
                >
                  <p className="font-semibold text-[var(--color-primary)]">No nodes yet</p>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    Drag a node type from the left and drop it here to start your funnel.
                  </p>
                </div>
              </Panel>
            )}
            <FlowPositionRefSetter />
            </ReactFlow>
            </NodeActionsContext.Provider>
          </EdgeActionsContext.Provider>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <FunnelBuilderInner />
    </ReactFlowProvider>
  );
}

export default App;
