import { useCallback, useRef } from 'react';

interface ToolbarProps {
  onExport: () => void;
  onImport: (json: string) => void;
  onClear: () => void;
  validationMessages: string[];
}

export function Toolbar({
  onExport,
  onImport,
  onClear,
  validationMessages,
}: ToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        if (text) onImport(text);
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [onImport]
  );

  return (
    <header
      id="toolbar"
      className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md px-6 py-3.5 shadow-[var(--shadow-sm)]"
      role="toolbar"
      aria-label="Funnel actions"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-indigo-600 text-white shadow-lg shadow-indigo-500/30 text-lg" aria-hidden>
            🐼
          </span>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-primary)]">
            Funnel Builder
          </h1>
        </div>
        {validationMessages.length > 0 && (
          <div
            className="rounded-xl bg-[var(--color-warning-bg)] px-4 py-2 text-sm font-medium text-amber-800 border border-amber-200/80 shadow-sm"
            role="status"
            aria-live="polite"
          >
            {validationMessages.join(' ')}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          onChange={handleFileChange}
          aria-label="Import JSON file"
        />
        <button
          type="button"
          onClick={handleImportClick}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] shadow-[var(--shadow-sm)] transition-all hover:border-[var(--color-border-strong)] hover:bg-[var(--color-accent-bg)] hover:text-[var(--color-accent)] hover:shadow-[var(--shadow-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
        >
          Import JSON
        </button>
        <button
          type="button"
          onClick={onExport}
          className="rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl border border-red-200 bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--color-destructive)] transition-all hover:bg-red-50 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
        >
          Clear
        </button>
      </div>
    </header>
  );
}
