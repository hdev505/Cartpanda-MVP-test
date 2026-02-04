# Modern Dashboard Architecture — CartPanda

How I would build a modern admin dashboard for a funnels + checkout product (funnels, orders, customers, subscriptions, analytics, disputes, settings, permissions) so it stays fast and consistent as it grows, supports multiple engineers shipping in parallel, avoids big-rewrite traps, and meets WCAG standards.

---

## 1. Architecture

**Routes and feature modules**

- **Route structure:** One top-level router (e.g. React Router) with domain-based segments: `/funnels`, `/orders`, `/customers`, `/subscriptions`, `/analytics`, `/disputes`, `/settings`. Each segment can have sub-routes (e.g. `/funnels/:id`, `/orders?status=...`). Use a single `routes.tsx` (or route config) that imports lazy route components so the structure is obvious and code-splitting is per-route.
- **Feature folders:** Each domain is a **feature module** that owns its routes, pages, domain-specific components, API hooks, and types. Example:

  ```
  src/
    app/           # Shell: router, layout, auth wrapper
    features/
      funnels/     # list, detail, create, components, api, types
      orders/
      customers/
      ...
    shared/        # UI primitives, design tokens, shared hooks, utils
  ```

- **Shared UI:** Live in `shared/` (or `components/`, `design-system/`). Feature modules **use** shared components and may wrap or compose them; they don’t redefine buttons or layout. This keeps a single source of truth and avoids one-off UI.
- **Avoiding spaghetti:** Clear rules: (1) features don’t import from other features’ internals (only from their public API or shared). (2) Data fetching and server state stay in feature-owned hooks (e.g. `useOrders`, `useFunnel`) that call a shared API client. (3) Shared state (e.g. current org, user) lives in a thin app-level context or store; features read it, they don’t own it.

---

## 2. Design system

**Build vs buy**

- I’d start with a **bought** headless or low-level component library (e.g. Radix UI, Ark UI) for accessibility and behavior, and **build** our visual layer on top (tokens, theme, layout, data-dense components like tables and charts). That gives WCAG-friendly primitives without locking us into a full UI kit’s look.
- If the team is small and speed is critical, a full component library (e.g. Chakra, MUI) is acceptable as long as we enforce tokens and theming from day one so we can swap or restyle later.

**Consistency and accessibility**

- **Tokens:** Design tokens for colors, spacing, typography, radii, shadows (CSS variables or a token pipeline). All components use tokens only—no hardcoded hex or pixel values in feature code.
- **Theming:** One theme object (light/dark) that maps to tokens. Prefer `prefers-color-scheme` plus a manual toggle; store preference in localStorage and apply via a class or data attribute.
- **Typography and spacing:** Typography scale and spacing scale defined in tokens; shared layout components (Page, Section, Card, Stack) use them. Enforce a limited set of text styles (e.g. heading levels, body, caption) so we don’t get one-off font sizes.
- **Accessibility (WCAG):** (1) Use the design system’s focus styles everywhere and never disable focus without a visible alternative. (2) Require sufficient contrast (tokens checked against WCAG AA). (3) Form components must have labels, error messages linked via `aria-describedby`, and clear required/optional state. (4) Tables must be marked up semantically and support keyboard and screen readers. (5) Run axe or similar in CI on critical flows and document any known exceptions.

---

## 3. Data fetching and state

**Server state vs client state**

- **Server state:** I’d use **TanStack Query (React Query)** for all server data (orders, funnels, customers, analytics, etc.). It gives caching, deduplication, loading/error/empty handling, and refetch policies. Each feature owns its queries (e.g. `useOrdersList`, `useFunnel(id)`).
- **Client state:** Prefer local state (useState/useReducer) or URL (search params for filters, pagination) so the UI is shareable and bookmarkable. Use a small client store (e.g. Zustand) only for true cross-feature UI state (e.g. sidebar open, selected org) if needed.

**Loading, error, and empty states**

- Every list or detail view should explicitly handle: loading (skeletons or spinners from the design system), error (error boundary or inline message + retry), and empty (empty state component with clear copy). I’d add a shared `QueryBoundary` (or use TanStack Query’s built-in states) so we don’t forget.
- Tables: loading skeleton for the table body; error row or banner; empty state when `data.length === 0`.

**Filters, sort, pagination**

- Keep filter/sort/pagination in the **URL** (search params) so views are shareable and back/forward work. TanStack Query’s `queryKey` should include those params so cache is per view. Use a shared pattern (e.g. `useTableState()` that returns `[params, setParams]` and syncs with the URL) so every table behaves the same.

---

## 4. Performance

- **Bundle splitting:** Route-based code splitting (lazy load each feature’s route). Heavy libs (charts, PDF, etc.) lazy loaded only on the routes that need them. Monitor bundle size in CI (e.g. `vite-bundle-visualizer` or size budget).
- **Virtualization:** Use virtualized lists (e.g. TanStack Virtual, react-window) for any list that can grow large (orders, customers). Tables with many rows should virtualize the body.
- **Memoization:** Memoize expensive derived data and list children (React.memo / useMemo / useCallback) where profiling shows benefit; avoid blanket memoization everywhere.
- **Rerenders:** Rely on TanStack Query’s granular subscriptions so only components that use a given query re-render when that query updates. Keep client state colocated and avoid lifting state unnecessarily.
- **Instrumentation:** Measure “dashboard feels slow” with (1) **Real User Monitoring (RUM):** e.g. Web Vitals (LCP, FID, CLS) and a custom “time to first table row” or “time to interactive” for key pages. (2) **Optional synthetic checks:** E2E that open critical routes and assert that key elements appear within a threshold. (3) Dashboards for Core Web Vitals and custom metrics so we can spot regressions and prioritize fixes.

---

## 5. DX and scaling to a team

- **Onboarding:** A short “Dashboard dev guide” (in the repo or Notion) that explains: folder structure, where to add a new feature, how to add a new route, how to use the design system and API hooks. Link to the design system (Storybook) and API docs.
- **Conventions:** Enforce with tooling: **ESLint** (React hooks, import order, no cross-feature imports), **Prettier** (format on save), **TypeScript** strict mode. **PR template** with checklists: “Does this follow feature-folder rules?”, “Any new shared component? If so, in Storybook?”, “Loading/error/empty considered?”.
- **Component guidelines:** New UI must use shared components and tokens. Exceptions require a short RFC or ticket. Storybook for every shared component with variants and a11y notes. This prevents one-off UI and keeps behavior consistent.

---

## 6. Testing strategy

- **Unit:** Pure logic (validation, formatters, state machines, store helpers) and critical hooks (e.g. validation rules). Fast feedback; run on every commit.
- **Integration:** Key flows that touch API and UI together: e.g. “load orders list”, “open funnel detail”, “submit filter”. Use MSW or a test backend so we don’t depend on production. Run in CI on every PR.
- **E2E:** A small set of critical paths (e.g. login → open orders → open one order; open funnels → create funnel). Run on main or before release; use Playwright or Cypress. Aim for stability over coverage.
- **Minimum bar:** Unit tests for shared utils and validation; at least one integration test per major feature; at least one E2E for the core “dashboard is usable” path. No PR that removes or breaks these without replacing them.

---

## 7. Release and quality

- **Feature flags:** Use a simple feature-flag service (e.g. LaunchDarkly, or an in-house API) for big or risky changes. New pages or flows can be turned off until ready. Flags are documented and removed once the feature is default-on for a while.
- **Staged rollouts:** Prefer releasing to a percentage of users or to internal first, then full rollout. Feature flags and deploy pipelines (e.g. Vercel preview → staging → production) support this.
- **Error monitoring:** Use an error tracking service (e.g. Sentry) with source maps. Alerts on error rate spikes. Errors tagged by feature or route so we can see which area is failing.
- **Ship fast but safe:** Default to shipping behind a flag or to a limited audience. Require PR review and green CI (lint, typecheck, unit, integration). E2E can be required on main only if they’re flaky. Post-release, watch error rates and key metrics; roll back or disable flag if something breaks.

---

## Summary

- **Architecture:** Feature folders that own routes and data; shared UI and API client; no cross-feature imports.
- **Design system:** Buy primitives (Radix/Ark), build our theme and tokens; enforce tokens and a11y (focus, contrast, semantics).
- **Data:** TanStack Query for server state; URL for filters/sort/pagination; explicit loading/error/empty everywhere.
- **Performance:** Route and lib code-splitting, virtualization for large lists, RUM + optional E2E for “feels slow.”
- **DX:** Docs, lint/format/TypeScript, PR template, Storybook, “use shared components” rule.
- **Testing:** Unit for logic and hooks; integration for key flows; E2E for critical paths; minimum bar in CI.
- **Release:** Feature flags, staged rollouts, error monitoring, and a clear “ship fast but safe” process.

