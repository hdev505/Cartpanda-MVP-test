# CartPanda — Funnel Builder (Front-end Practical Test)

A small drag-and-drop upsell funnel builder (visual editor only). Built with React, TypeScript, Vite, Tailwind CSS, and React Flow.

## Demo

- **Public URL:** [Deploy the `dist` folder to Vercel / Netlify / Cloudflare Pages and add the URL here]
- **Run locally:** see below.

## How to run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). No login required.

**Build for production:**

```bash
npm run build
npm run preview
```

## Main architecture decisions

- **React + TypeScript + Vite** — Fast dev experience and type safety; Vite for minimal config and quick builds.
- **React Flow** — Handles the canvas (pan, zoom), draggable nodes, edges, connections, grid, minimap, and keyboard delete. We only implement custom node types and drag-from-palette.
- **Single-page state** — Funnel state lives in React (`useNodesState` / `useEdgesState`). No global store; persistence is a side effect (localStorage + export/import).
- **Node types** — One custom node component (`FunnelNode`) with a `kind` in `data` (Sales Page, Order Page, Upsell, Downsell, Thank You). Labels and button text are driven from `store.ts` (defaults + auto-increment for Upsell/Downsell).
- **Validation** — `useFunnelValidation` computes: (1) Sales Page must have exactly one outgoing edge (warn on node), (2) Thank You has no source handle so cannot have outgoing edges, (3) orphan count. Validation is derived from `nodes`/`edges`, not stored separately.
- **Persistence** — Save to `localStorage` on every change; load once on mount. Export/Import JSON use the same `FunnelState` shape for portability.

## Tradeoffs / what I’d improve next

- **Drop position** — Uses a ref set by a child of React Flow (`FlowPositionRefSetter`) to get `screenToFlowPosition`, so drop position is correct with pan/zoom. A cleaner option would be a small context or a hook provided by a wrapper that’s inside the flow.
- **Undo/redo** — Not implemented; would add a history stack (e.g. past states of `nodes`/`edges`) and Ctrl+Z / Ctrl+Y.
- **Editable labels** — Node titles and button labels are static; next step would be inline edit or a side panel.
- **Tests** — No unit or E2E tests in this repo; I’d add tests for validation logic, store helpers, and one E2E for “add node, connect, export” (see dashboard doc for strategy).

## Accessibility notes

- **Semantic structure:** Toolbar is a `<header>` with `role="toolbar"` and `id="toolbar"` for a “Skip to toolbar” link. Palette is an `<aside>` with “Node palette” label. Canvas has `aria-label="Funnel canvas"`.
- **Focus:** Visible focus rings on nodes, handles, and controls (CSS `:focus-visible`). Skip link is visually hidden until focused.
- **Keyboard:** React Flow supports pan (arrow keys when nothing selected), delete (Backspace/Delete for selected nodes/edges). Palette items are buttons and can be focused and activated; drag is mouse/touch.
- **Labels:** Nodes use `aria-label` for the node and for connection handles. Validation messages use `role="status"` and `aria-live="polite"` where appropriate. Empty state is announced.
- **Motion:** `prefers-reduced-motion: reduce` disables transitions on nodes and edges.
- **Contrast:** Text and borders use colors that meet contrast requirements; focus ring uses a high-contrast blue.

## Project structure

```
src/
  App.tsx              # React Flow setup, drop handler, load/save, toolbar wiring
  main.tsx
  index.css            # Tailwind + React Flow focus/motion overrides
  types.ts             # NodeKind, FunnelNodeData, FunnelState
  store.ts             # localStorage, export/import, default labels, getNextLabel
  nodes/
    FunnelNode.tsx     # Single custom node UI for all kinds
    index.ts           # nodeTypes map
  components/
    Palette.tsx        # Left sidebar, drag sources
    Toolbar.tsx        # Export, Import, Clear, validation messages
  hooks/
    useFunnelValidation.ts  # Sales Page outgoing count, orphan count
```

## Part 2 — Dashboard architecture

See **[docs/dashboard-architecture.md](./docs/dashboard-architecture.md)** for the written answer on building a modern, scalable admin dashboard (architecture, design system, data fetching, performance, DX, testing, release).
