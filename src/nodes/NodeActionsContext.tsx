import { createContext, useContext } from 'react';

export type NodeActions = {
  deleteNode: (id: string) => void;
};

export const NodeActionsContext = createContext<NodeActions | null>(null);

export function useNodeActions(): NodeActions | null {
  return useContext(NodeActionsContext);
}
