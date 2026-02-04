import type { NodeKind } from '../types';
import { getDefaultTitle, getDefaultButtonLabel } from '../store';

const KINDS: { kind: NodeKind; label: string; icon: string; gradient: string }[] = [
  { kind: 'salesPage', label: 'Sales Page', icon: '📄', gradient: 'from-amber-400 to-orange-500' },
  { kind: 'orderPage', label: 'Order Page', icon: '🛒', gradient: 'from-blue-500 to-indigo-600' },
  { kind: 'upsell', label: 'Upsell', icon: '⬆️', gradient: 'from-emerald-500 to-teal-600' },
  { kind: 'downsell', label: 'Downsell', icon: '⬇️', gradient: 'from-orange-400 to-amber-500' },
  { kind: 'thankYou', label: 'Thank You', icon: '✅', gradient: 'from-slate-500 to-slate-600' },
];

function onDragStart(
  e: React.DragEvent<HTMLButtonElement>,
  kind: NodeKind
) {
  e.dataTransfer.setData('application/reactflow-node-kind', kind);
  e.dataTransfer.effectAllowed = 'move';
}

export function Palette() {
  return (
    <aside
      className="flex w-60 flex-shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-sm p-5 shadow-[var(--shadow-md)]"
      aria-label="Node palette"
    >
      <div className="mb-4">
        <h2 className="text-sm font-bold tracking-tight text-[var(--color-primary)]">
          Add nodes
        </h2>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Drag a type onto the canvas.
        </p>
      </div>
      <ul className="flex flex-col gap-2.5" role="list">
        {KINDS.map(({ kind, label, icon, gradient }) => (
          <li key={kind}>
            <button
              type="button"
              draggable
              onDragStart={(e) => onDragStart(e, kind)}
              className={`flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 text-left text-sm font-semibold text-[var(--color-primary)] shadow-[var(--shadow-sm)] transition-all hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 active:translate-y-0`}
              aria-label={`Drag to add ${label} node`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-lg shadow-md`}
                aria-hidden="true"
              >
                {icon}
              </span>
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function getPaletteNodeData(kind: NodeKind) {
  return {
    kind,
    title: getDefaultTitle(kind),
    buttonLabel: getDefaultButtonLabel(kind),
  };
}
