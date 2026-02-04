import type { Node, Edge } from 'reactflow';
import type { FunnelState, NodeKind } from './types';

const STORAGE_KEY = 'cartpanda-funnel';

const DEFAULT_BUTTON_LABELS: Record<NodeKind, string> = {
  salesPage: 'Learn More',
  orderPage: 'Buy Now',
  upsell: 'Add to Order',
  downsell: 'Maybe Later',
  thankYou: 'Continue',
};

/** Get next auto-increment label for Upsell/Downsell given existing nodes */
export function getNextLabel(
  kind: 'upsell' | 'downsell',
  nodes: Node<{ kind: NodeKind; title: string; buttonLabel: string }>[]
): string {
  const prefix = kind === 'upsell' ? 'Upsell' : 'Downsell';
  const existing = nodes
    .map((n) => n.data?.title)
    .filter((t): t is string => typeof t === 'string' && t.startsWith(prefix));
  const indices = existing
    .map((t) => parseInt(t.replace(prefix, '').trim(), 10))
    .filter((n) => !Number.isNaN(n));
  const next = indices.length > 0 ? Math.max(...indices) + 1 : 1;
  return `${prefix} ${next}`;
}

export function getDefaultTitle(kind: NodeKind): string {
  const titles: Record<NodeKind, string> = {
    salesPage: 'Sales Page',
    orderPage: 'Order Page',
    upsell: 'Upsell 1',
    downsell: 'Downsell 1',
    thankYou: 'Thank You',
  };
  return titles[kind];
}

export function getDefaultButtonLabel(kind: NodeKind): string {
  return DEFAULT_BUTTON_LABELS[kind];
}

export function loadFunnel(): FunnelState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FunnelState;
    if (!parsed?.nodes || !Array.isArray(parsed.nodes)) return null;
    if (!parsed?.edges || !Array.isArray(parsed.edges)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveFunnel(nodes: Node[], edges: Edge[]): void {
  const state: FunnelState = {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type ?? 'funnelNode',
      position: n.position,
      data: n.data as FunnelState['nodes'][0]['data'],
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    })),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportFunnelJson(nodes: Node[], edges: Edge[]): string {
  const state: FunnelState = {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type ?? 'funnelNode',
      position: n.position,
      data: n.data as FunnelState['nodes'][0]['data'],
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    })),
  };
  return JSON.stringify(state, null, 2);
}

export function parseFunnelJson(json: string): FunnelState | null {
  try {
    const parsed = JSON.parse(json) as FunnelState;
    if (!parsed?.nodes || !Array.isArray(parsed.nodes)) return null;
    if (!parsed?.edges || !Array.isArray(parsed.edges)) return null;
    return parsed;
  } catch {
    return null;
  }
}
