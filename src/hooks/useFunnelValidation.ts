import { useMemo } from 'react';
import type { Node, Edge } from 'reactflow';
import type { NodeKind } from '../types';

export function useFunnelValidation(nodes: Node[], edges: Edge[]): {
  messages: string[];
  invalidOutgoingNodeIds: Set<string>;
  orphanNodeIds: Set<string>;
} {
  return useMemo(() => {
    const messages: string[] = [];
    const invalidOutgoingNodeIds = new Set<string>();
    const orphanNodeIds = new Set<string>();

    const outDegree = new Map<string, number>();
    const inDegree = new Map<string, number>();
    for (const n of nodes) {
      outDegree.set(n.id, 0);
      inDegree.set(n.id, 0);
    }
    for (const e of edges) {
      outDegree.set(e.source, (outDegree.get(e.source) ?? 0) + 1);
      inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
    }

    for (const node of nodes) {
      const kind = (node.data as { kind?: NodeKind })?.kind;
      const out = outDegree.get(node.id) ?? 0;
      const inCount = inDegree.get(node.id) ?? 0;

      if (kind === 'salesPage' && out !== 1) {
        invalidOutgoingNodeIds.add(node.id);
        messages.push('Sales Page should have exactly one outgoing connection.');
      }
      if (nodes.length > 1 && inCount === 0 && kind !== 'salesPage') {
        orphanNodeIds.add(node.id);
      }
    }

    if (orphanNodeIds.size > 0) {
      messages.push(`This funnel has ${orphanNodeIds.size} orphan node(s).`);
    }

    return { messages, invalidOutgoingNodeIds, orphanNodeIds };
  }, [nodes, edges]);
}
