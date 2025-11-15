# Oru Autonomous Enterprise Platform

Production-ready monorepo that powers the Oru operational wedge for F&B enterprises. It pairs a Next.js 14 frontline UI with Express/tRPC APIs and Pythonic decision agents orchestrated via FastAPI.

## Monorepo layout

```text
apps/
  web/                 # Next.js 14 App Router (Odoo-inspired UI)
  api/                 # Express + tRPC backend
  agent-orchestrator/  # FastAPI router for agent coordination
  decision-engine/     # Decision intelligence service
  migration-toolkit/   # Node-based SAP/Oracle migrations
packages/
  database/            # Prisma schema + migrations
  ui/                  # Shared shadcn-inspired component kit
  shared/              # Cross-app TypeScript contracts
  composer/            # Low-code workflow runtime
  forge/               # API-first developer tooling
  agent-sdk/           # Python base class + utilities
services/
  *-agent/             # Domain copilots (inventory, production, etc.)
```

## Phase 1 dependency highlights

- **Web**: Next.js 14, React 18, @tanstack/react-query, zustand, react-hook-form, zod, framer-motion, recharts, react-barcode-scanner, shadcn/ui patterns, socket.io-client.
- **API**: Express, @trpc/server, Prisma, Bull + BullMQ, ioredis, jsonwebtoken, multer, node-cron, winston.
- **Migration toolkit**: sap-rfc-client, oracledb, csv-parse, node-etl.
- **Python agents**: fastapi[all], langchain, openai, pandas, prophet, pulp, celery[redis], motor, pydantic.

## Phase 4 copilots + decision intelligence

- **Inventory Co-Pilot** (`services/inventory-agent/src/copilot_agent.py`): monitors QA holds, expiry, cold-chain telemetry, and stockout risk while drafting human-facing alerts and QA approval summaries.
- **Production Planning Co-Pilot** (`services/production-agent/src/bom_optimizer.py`): performs BOM explosion with availability deltas, capacity balancing, allergen guardrails, and regulatory batch sizing guidance.
- **Decision Intelligence Engine** (`apps/decision-engine/src/decision_framework.py`): enforces structured decisions with reusable templates, noise/bias detection, and cross-module consistency scoring.
- **Decision Wizard UI** (`apps/web/app/components/decisions/DecisionWizard.tsx`): App Router component exposing step-by-step guidance, comparison matrices, bias callouts, history, and audit-trail exports for human-in-the-loop approvals.

## GPT-5.1 Codex enablement

All downstream services gate against `GPT_5_1_CODEX_ENABLED` (see `.env.example`). Keep it `true` to enable GPT-5.1-Codex (Preview) for every client session routed through the orchestrator.

## Getting started

```powershell
pnpm install
pnpm run dev
```

Bring up infra dependencies:

```powershell
make db-up
```

## Testing + quality gates

```powershell
pnpm lint
pnpm typecheck
pnpm test
```

Python services rely on uv or pip; each folder contains its own `pyproject.toml`. Use `uv sync` or `pip install -e .` as preferred.

## Notes

- Login, operations dashboard, and inventory management screens in `apps/web` are now fully aligned with the latest prompt-provided TSX specs, including the refreshed hero, KPI donuts, QA workflows, and AI recommendation blocks.
- Execution workspace now includes `/execution/projects` (Prompt 7) with Kanban/timeline/list modes plus `/execution/decisions` (Prompt 8) for the AI-assisted decision registry and noise diagnostics, and `/finance` (Prompt 9) for budget tracking + AI forecasting.
- `/login`, `/execution/projects`, and `/execution/decisions` are now backed by lightweight Next.js API routes plus React Query hooks, so UI flows exercise real request/response paths even before the Express/tRPC APIs land.
- `pnpm --filter web build` passes, so the Next.js frontend is production-build ready after the most recent UI refresh.
- Back-end services and agents remain unchanged from the initial import; no additional migrations or schema updates were required for this UI iteration.

- `/intelligence/agents` (Prompt 10) now surfaces the multi-agent operations cockpit with confidence metrics, performance charting, and inline configuration controls for each autonomous copilot.
- `/mobile/warehouse` (Prompt 11) delivers the mobile-first warehouse companion with live shift stats, task queue, scanner hand-off, dock visibility, and quick action tiles.
- `/composer` (Prompt 12) introduces the low-code workflow composer with drag-and-drop component library, canvas visualization, live validation wiring, and contextual properties editor for each node.
- `/pharma/validation` (Prompt 1) provides the GMP validation cockpit with release queue telemetry, cold-chain risk segmentation, and AI QA copilot actions.
- `/manufacturing/shopfloor` (Prompt 2) unlocks the precision manufacturing console covering OEE breakdowns, cell timelines, and automation recommendations.
- `/retail/operations` (Prompt 3) adds the omni-channel operations hub with channel mix analytics, fulfillment waves, and promo/loyalty experiments.
- Pharma, precision manufacturing, and retail Prisma modules now live under `apps/api/src/modules/*`, capturing release dossiers, CNC telemetry, and omni-channel fulfillment data structures that back the new dashboards.

## Next steps

1. Gather any revised prompt copy or new feature requirements for the operations dashboard, execution suite, or finance flows and mirror them in the corresponding App Router routes.
2. Replace the interim Next.js API mocks with calls to the Express/tRPC services (auth, execution orchestration, decision intelligence, finance) once those endpoints are available.
3. Re-run the web build and top-level turborepo pipelines (`pnpm build`, `pnpm lint`, `pnpm test`) once new integrations land to keep the monorepo healthy.

## License

Proprietary – internal use for the Oru program.
