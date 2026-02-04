import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { NodeKind } from '../types';
import { getDefaultButtonLabel } from '../store';
import { useNodeActions } from './NodeActionsContext';

const KIND_ICONS: Record<NodeKind, string> = {
  salesPage: '📄',
  orderPage: '🛒',
  upsell: '⬆️',
  downsell: '⬇️',
  thankYou: '✅',
};

const KIND_STYLES: Record<NodeKind, { border: string; bg: string; iconBg: string; buttonBg: string }> = {
  salesPage: {
    border: 'border-amber-400/90',
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50/90',
    iconBg: 'from-amber-400 to-orange-500',
    buttonBg: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500',
  },
  orderPage: {
    border: 'border-blue-400/90',
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50/90',
    iconBg: 'from-blue-500 to-indigo-600',
    buttonBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500',
  },
  upsell: {
    border: 'border-emerald-400/90',
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50/90',
    iconBg: 'from-emerald-500 to-teal-600',
    buttonBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
  },
  downsell: {
    border: 'border-orange-400/90',
    bg: 'bg-gradient-to-br from-orange-50 to-amber-50/90',
    iconBg: 'from-orange-400 to-amber-500',
    buttonBg: 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500',
  },
  thankYou: {
    border: 'border-slate-400/90',
    bg: 'bg-gradient-to-br from-slate-50 to-slate-100/90',
    iconBg: 'from-slate-500 to-slate-600',
    buttonBg: 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600',
  },
};

interface FunnelNodeData {
  kind: NodeKind;
  title: string;
  buttonLabel: string;
  /** Optional: show warning when Sales Page has != 1 outgoing */
  invalidOutgoing?: boolean;
}

function FunnelNodeComponent({ id, data }: NodeProps<FunnelNodeData>) {
  const { kind, title, buttonLabel, invalidOutgoing } = data;
  const actions = useNodeActions();
  const style = KIND_STYLES[kind] ?? KIND_STYLES.thankYou;
  const icon = KIND_ICONS[kind] ?? '•';
  const hasNoOutgoing = kind === 'thankYou';
  const showSourceHandle = !hasNoOutgoing;
  const label = buttonLabel || getDefaultButtonLabel(kind);

  const onDelete = useCallback(() => {
    actions?.deleteNode(id);
  }, [id, actions]);

  return (
    <div
      className={`w-[232px] min-w-[232px] max-w-[232px] rounded-2xl border-2 ${style.border} ${style.bg} shadow-[var(--shadow-md)] transition-all duration-200 hover:shadow-[var(--shadow-lg)] focus-within:ring-2 focus-within:ring-[var(--color-accent)] focus-within:ring-offset-2 relative ${
        invalidOutgoing ? 'ring-2 ring-red-400 ring-offset-2' : ''
      }`}
      role="article"
      aria-label={`Funnel node: ${title}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3.5 !w-3.5 !border-2 !border-[var(--color-edge)] !bg-[var(--color-surface)] !shadow-sm"
        aria-label={`Connect to ${title}`}
      />
      <button
        type="button"
        onClick={onDelete}
        className="nodrag nopan absolute right-2.5 top-2.5 rounded-full p-1.5 text-[var(--color-muted)] transition-all hover:bg-red-100 hover:text-[var(--color-destructive)] focus:outline-none focus:ring-2 focus:ring-[var(--color-destructive)] focus:ring-offset-2"
        aria-label={`Delete ${title} node`}
        title="Delete node"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <div className="p-4">
        <div className="mb-3 flex items-center gap-3 pr-8">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${style.iconBg} text-lg shadow-md`}
            aria-hidden="true"
          >
            {icon}
          </span>
          <h3 className="font-bold text-[var(--color-primary)] truncate" title={title}>
            {title}
          </h3>
        </div>
        <div className="h-12 rounded-xl flex items-center justify-center text-xs font-medium text-[var(--color-muted)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/80">
          Thumbnail
        </div>
        <button
          type="button"
          className={`mt-3 w-full rounded-xl ${style.buttonBg} py-2.5 text-sm font-semibold text-white shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60`}
          disabled
          aria-label={`Primary action: ${label}`}
        >
          {label}
        </button>
        {kind === 'salesPage' && (
          <div className="mt-2 min-h-[1.25rem] flex items-center min-w-0">
            {invalidOutgoing && (
              <p className="text-xs font-medium text-[var(--color-destructive)] break-words min-w-0" role="status">
                Sales Page should have exactly one outgoing connection.
              </p>
            )}
          </div>
        )}
      </div>
      {showSourceHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-3.5 !w-3.5 !border-2 !border-[var(--color-edge)] !bg-[var(--color-surface)] !shadow-sm"
          aria-label={`Connect from ${title}`}
        />
      )}
    </div>
  );
}

export const FunnelNode = memo(FunnelNodeComponent);
