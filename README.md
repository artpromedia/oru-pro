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

## License

Proprietary – internal use for the Oru program.
