/**
 * Funnel node kinds — used for palette and node type.
 * "Thank You" has no outgoing edges; "Sales Page" should have one outgoing (warn if invalid).
 */
export type NodeKind = 'salesPage' | 'orderPage' | 'upsell' | 'downsell' | 'thankYou';

export interface FunnelNodeData {
  kind: NodeKind;
  /** Display title, e.g. "Upsell 1", "Thank You" */
  title: string;
  /** Static primary button label shown on the node */
  buttonLabel: string;
}

/** Persisted funnel shape for localStorage and JSON export/import */
export interface FunnelState {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: FunnelNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}
