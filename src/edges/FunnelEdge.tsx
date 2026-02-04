import { memo, useCallback, createContext, useContext } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from 'reactflow';

type EdgeActions = { deleteEdge: (id: string) => void };
const EdgeActionsContext = createContext<EdgeActions | null>(null);

export function useEdgeActions(): EdgeActions | null {
  return useContext(EdgeActionsContext);
}

function FunnelEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  selected,
  pathOptions,
}: EdgeProps) {
  const actions = useEdgeActions();

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: pathOptions?.borderRadius ?? 12,
    offset: pathOptions?.offset ?? 20,
  });

  const onDelete = useCallback(() => {
    actions?.deleteEdge(id);
  }, [id, actions]);

  return (
    <>
      <BaseEdge
        path={path}
        style={style}
        markerEnd={markerEnd}
      />
      {selected && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              left: labelX,
              top: labelY,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'all',
            }}
          >
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full bg-gradient-to-r from-red-500 to-red-600 p-2 text-white shadow-lg transition-all hover:from-red-600 hover:to-red-700 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              aria-label="Delete connection"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const FunnelEdge = memo(FunnelEdgeComponent);

export { EdgeActionsContext };
