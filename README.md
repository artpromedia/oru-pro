# Oonru Autonomous Enterprise Platform

[![Quality Gates](https://github.com/artpromedia/oru-pro/actions/workflows/quality.yml/badge.svg)](https://github.com/artpromedia/oru-pro/actions/workflows/quality.yml)

Production-ready monorepo that powers the Oonru operational wedge for F&B enterprises. It pairs a Next.js 14 frontline UI with Express/tRPC APIs and Pythonic decision agents orchestrated via FastAPI.

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
backend/               # Express + Prisma operations API powering health + telemetry routes
```

## Phase 1 dependency highlights

- **Web**: Next.js 14, React 18, @tanstack/react-query, zustand, react-hook-form, zod, framer-motion, recharts, react-barcode-scanner, shadcn/ui patterns, socket.io-client.
- **API**: Express, @trpc/server, Prisma, Bull + BullMQ, ioredis, jsonwebtoken, multer, node-cron, winston.
- **Migration toolkit**: sap-rfc-client, oracledb, csv-parse, node-etl.
- **Python agents**: fastapi[all], langchain, openai, pandas, prophet, pulp, celery[redis], motor, pydantic.

## Operations backend (Express + Prisma)

- Location: `backend/` (registered as `@oru/backend` in the pnpm workspace).
- Express 4 stack with Helmet, CORS, compression, rate limiting, Socket.IO, and Winston logging for realtime-friendly APIs.
- Middleware: `authMiddleware` reads tenant/user headers, and `errorHandler` + `notFoundHandler` centralize JSON error responses with trace IDs.
- Routes:
  - `/livez` and `/health/*` provide liveness/readiness telemetry.
  - `/api/operations/*` now streams tenant-scoped inventory, production, procurement, decision, and agent telemetry plus a `/events/:channel` Socket.IO broadcaster for Phase 4 copilots.
  - `/api/monitoring/*` exposes the Prompt 6 real-time monitoring dashboard API with StatsD-backed system gauges, tenant-scoped business/agent metrics, live Bull/BullMQ queue telemetry, cached alert feeds, and Socket.IO broadcasts for every org room (`org:<tenantId>`).
  - `/api/decisions/*` exposes the decision registry, batch review, AI noise/bias analysis, and automation endpoints that can spin up procurement POs or production schedules directly from approvals.
  - `/api/agents/*` introduces Prompt 5's agent management APIs for rosters, KPIs, recent activity, config updates, and runtime command dispatch.
  - `/api/comms/*` now backs the Slack-grade execution comms hub with channel listings, message CRUD, reactions, pins, and Redis-powered presence so the Next.js dashboard reads/writes real Prisma data.
  - `/api/inventory` now serves the realtime inventory pulse feed that powers `apps/web/app/page.tsx`, emitting `InventorySnapshot[]` data with optional `tenantId`, `limit`, `qa`, and `coldChain` query filters straight from the Prisma `Inventory` table.
  - `apps/api/src/services/inventoryService.ts` now powers the low-stock/expiry/QA business logic bridge, emitting Redis + Socket.IO alerts while auto-triggering AI recommendations, PO drafts, and QA approvals through the InventoryAgent.
  - `/api/auth/*` now powers login, MFA verification, bearer session refresh, logout, and tenant-scoped user management (list/create/update/reset) backed by bcrypt, JWT, Speakeasy TOTP, and email stubs.
- Prisma data model: `backend/prisma/schema.prisma` mirrors the multi-tenant org, inventory, production, procurement, and agent requirements outlined in the prompt; `pnpm --filter @oru/backend prisma generate` keeps the client fresh.
- Local commands:

```powershell
pnpm --filter @oru/backend dev       # regenerate Prisma client + start the Express server with ts-node-dev
pnpm --filter @oru/backend build     # emit dist/ via tsc
pnpm --filter @oru/backend start     # run the compiled server
```

## SAP-grade inventory backend

- **Prisma data model**: `packages/database/prisma/schema.prisma` now captures tenants, plants, storage locations, materials/batches, material stock ledgers, purchase orders/items, handling units, quality lots, inventory alerts, and forecast snapshots so MB52/MIGO/MD04 workflows have native persistence.
- **Express routes**: `apps/api/src/routes/inventory.ts` exposes `/api/inventory/mb52`, `/api/inventory/migo`, and `/api/inventory/md04`, complete with Redis caching, BullMQ audit fan-out, and audit-log coverage to mirror SAP t-code semantics.
- **Scheduler + hooks**: `apps/api/src/scheduler.ts` now runs an hourly cron sweep that calls `inventoryService.runScheduledInventoryCheck` for every org/tenant discovered in the inventory ledger, while the tRPC inventory router immediately re-evaluates SKUs after every receipt, QA approval, transfer, or adjustment so low-stock/expiry/QA alerts propagate to Redis + Socket.IO in seconds.
- **AI copilot**: `apps/api/src/lib/ai/agent.ts` blends TensorFlow trend fitting, OpenAI narrative summaries, and Chroma embeddings to forecast demand and narrate inventory risk.
- **LLM fallback**: `apps/api/src/lib/ai/providers.ts` now orchestrates OpenAI → Anthropic → Gemini → Llama (via Groq) so guidance keeps flowing even if the primary foundation model is offline.
- **Realtime**: `apps/api/src/websocket/server.ts` centralizes Socket.IO broadcasting so inventory/production/quality channels emit updates as soon as MIGO transactions settle.

### Additional environment variables

Add the following to `.env` for the API layer:

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | Optional key to enable narrative + recommendation output from the inventory AI agent. |
| `OPENAI_MODEL` | Primary OpenAI model name (defaults to `gpt-4o-mini`). |
| `ANTHROPIC_API_KEY` | Optional key for Claude fallback when OpenAI is unavailable. |
| `ANTHROPIC_MODEL` | Claude model identifier (defaults to `claude-3-5-sonnet-20241022`). |
| `GEMINI_API_KEY` | Optional Google Gemini key for tertiary fallback. |
| `GEMINI_MODEL` | Gemini model identifier (defaults to `gemini-1.5-flash`). |
| `GROQ_API_KEY` | Optional Groq key that proxies Meta Llama models for final fallback. |
| `LLAMA_MODEL` | Meta Llama (via Groq) model identifier (defaults to `llama3-70b-8192`). |
| `CHROMA_URL` | Optional ChromaDB endpoint for persisting inventory narratives + embeddings. |
| `REALTIME_ALLOWED_ORIGINS` | Comma-delimited origins for the Socket.IO server (falls back to `NEXT_PUBLIC_SOCKET_URL` or `*`). |

## Phase 4 copilots + decision intelligence

- **Inventory Co-Pilot** (`services/inventory-agent/src/copilot_agent.py`): monitors QA holds, expiry, cold-chain telemetry, and stockout risk while drafting human-facing alerts and QA approval summaries.
- **Production Planning Co-Pilot** (`services/production-agent/src/bom_optimizer.py`): performs BOM explosion with availability deltas, capacity balancing, allergen guardrails, and regulatory batch sizing guidance.
- **Decision Intelligence Engine** (`apps/decision-engine/src/decision_framework.py`): enforces structured decisions with reusable templates, noise/bias detection, and cross-module consistency scoring.
- **Decision Wizard UI** (`apps/web/app/components/decisions/DecisionWizard.tsx`): App Router component exposing step-by-step guidance, comparison matrices, bias callouts, history, and audit-trail exports for human-in-the-loop approvals.
- **Decision Noise Agent** (`services/agent-orchestrator/agents/decision_agent.py`): joins the FastAPI orchestrator roster to score signal quality, surface automation bias, and recommend approval/escalation paths for noisy decision queues.

## GPT-5.1 Codex enablement

All downstream services gate against `GPT_5_1_CODEX_ENABLED` (see `.env.example`). Keep it `true` to enable GPT-5.1-Codex (Preview) for every client session routed through the orchestrator.

## Multi-tenant authentication & session pipeline

- `apps/web/lib/auth/index.ts` implements the tenant-aware session manager, bcrypt-based credential validation, TOTP MFA checks (via Speakeasy), Redis-backed audit logs, and JWT issuance helpers.
- New API routes under `apps/web/app/api/auth/*` expose `POST /api/auth/login`, `POST /api/auth/mfa`, and `GET /api/auth/session` so the login UI exercises real persistence with MFA challenges.
- `apps/web/middleware.ts` now enforces bearer/cookie tokens for every protected dashboard/partner route and injects tenant/user headers for downstream handlers.
- Required secrets: `JWT_SECRET`, `SUPER_ADMIN_PASSWORD_HASH`, and `SUPER_ADMIN_MFA_SECRET`, plus the existing `DATABASE_URL`, `REDIS_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` for tenant data and cache fan-out.
- Successful MFA verification returns signed tokens that front-end clients should persist as the `oru.session` cookie or standard `Authorization: Bearer <token>` header when calling APIs.

### Development login shortcuts

- **Email**: `artpromedia@oonru.ai`
- **Password**: `SuperOonru!23`
- **MFA Secret**: `JBYUQRS6IFJCGQKXFJHDELTUNVUUWN3U` (import into Authy/Google Authenticator as a TOTP account)

These values are automatically injected whenever `SUPER_ADMIN_PASSWORD_HASH`/`SUPER_ADMIN_MFA_SECRET` are not set and `NODE_ENV !== "production"`, so you can log in immediately after `pnpm dev`. For production, generate your own secrets:

```powershell
pnpm --filter @oru/web exec node -p "require('bcryptjs').hashSync('<YourPassword>', 10)"
```

Paste the resulting hash into both `.env` (API) and `.env.local` (web), then set `SUPER_ADMIN_MFA_SECRET` to a base32 string from your authenticator of choice.

## Forge marketplace, SAP migration kit, and document control

- `/forge` exposes the Oonru Forge marketplace with curated categories, installed app health, developer SDK downloads, and a live-code builder for partner extensions.
- Forge builder UI now consumes these endpoints with a catalog modal (filters, installs, reviews) plus an AI assistant that can scaffold inventory, quality, and procurement blueprints directly on the canvas.
- Forge marketplace APIs now live under `apps/web/app/api/forge/marketplace/*`, including `GET /forge/marketplace` for catalog search, `POST /forge/marketplace/install` for workspace installs, and `GET|POST /forge/marketplace/[appId]/ratings` for AI copilot review telemetry.
- `/migration/sap` delivers the SAP migration kit featuring phase timelines, connection assistants, module selection, and table-level mapping previews across ECC/S/4 workloads.
- `/documents` introduces the AI-assisted document cockpit with drag-and-drop uploads, compliance indicators, and inline actions; uploads call `/api/v1/documents` for real persistence.
- `/api/v1/documents` is backed by `storageManager`, `aiDocumentProcessor`, and `complianceChecker`, handling hashing, duplicate detection, secure storage, AI enrichment, compliance validation, auditing, and Redis-based search indexing.
- Optional env vars: `DOCUMENT_STORAGE_PATH` (defaults to `./uploads/documents`) and `DOCUMENT_ENCRYPTION_KEY` for AES-256-GCM at rest; keep `DOCUMENTS`-related permissions (`documents.read`, `documents.write`) enabled per tenant role to exercise the routes.

## Getting started

```powershell
pnpm install
pnpm run dev
```

Bring up infra dependencies:

```powershell
make db-up
```

### Local Docker stack (Prompt 7)

1. Copy `.env.development` to `.env` or source it in your shell to expose service URLs/secrets.
2. Start the supporting databases, queues, and observability tooling:

```powershell
docker compose -f docker-compose.dev.yml up -d
```

This launches Postgres, Redis, RabbitMQ, Qdrant, StatsD, Grafana, MinIO, Mailhog, and Adminer on the `oru-network`. Grafana is pre-provisioned to read from Postgres/Redis, StatsD uses `config/statsd.js`, and Postgres runs the bootstrap SQL in `scripts/init.sql` on first start. Shut everything down with:

```powershell
docker compose -f docker-compose.dev.yml down -v
```

## Development tips

- **Next.js dev port**: `pnpm dev` expects port 3000 for the web app. If it's already taken (for example by another Next.js instance), the dev server automatically hops to 3001. Free the port or browse `http://localhost:3001` when that happens.
- **Lingering Node processes**: When turborepo tasks crash on Windows they can leave dozens of orphaned `node.exe` processes that hold locks on Prisma engine DLLs. Run `Stop-Process -Name node -Force` in PowerShell before restarting `pnpm dev` to release the files.

## Testing + quality gates

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @oru/backend test   # Express smoke tests
pnpm --filter @oru/web build      # Production Next.js sanity
```

Python services rely on uv or pip; each folder contains its own `pyproject.toml`. Use `uv sync` or `pip install -e .` as preferred. The agent orchestrator is validated automatically via `pip install -e services/agent-orchestrator && python -m compileall services/agent-orchestrator` inside `.github/workflows/quality.yml`.

Infrastructure verification:

```powershell
make infra-validate
# (runs docker compose config + optional kubectl --dry-run)
```

> CI: The `Quality Gates` workflow executes `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and the Python agent sanity checks on every push/PR to `main`.

## Beta release checklist

1. Confirm `git status -sb` is clean (or only contains intentional version bumps) so the beta tag reflects committed changes.
2. Run the full JS/TS battery locally (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm --filter @oru/web test:e2e`, `pnpm --filter @oru/backend test`, and `pnpm --filter @oru/api test`).
3. Build both the frontend and backend (`pnpm --filter @oru/web build`, `pnpm --filter @oru/backend build`) to ensure there are no production-only regressions.
4. Reinstall and validate the FastAPI services:

   - `pip install -e services/agent-orchestrator && python -m compileall services/agent-orchestrator`
   - `pip install -e services/finance-agent[dev] && pytest services/finance-agent/tests`

5. Smoke the shared infrastructure locally: `make infra-validate` followed by `docker compose -f docker-compose.dev.yml up -d postgres redis` and wait for `pg_isready` + `redis-cli ping` to succeed before running `docker compose -f docker-compose.dev.yml down -v`.
6. Confirm the `Quality Gates` workflow (including the Docker/K8s Smoke job) is green on the commit you intend to tag for beta and capture the run URL in release notes (the badge above links to the latest run).
7. Verify the manual beta scenarios (login + MFA, operations dashboards, AI decision wizard) against the staging environment and record any exceptions in the release log.

## Notes

- Login, operations dashboard, and inventory management screens in `apps/web` are now fully aligned with the latest prompt-provided TSX specs, including the refreshed hero, KPI donuts, QA workflows, and AI recommendation blocks.
- Execution workspace now includes `/execution/projects` (Prompt 7) with Kanban/timeline/list modes plus `/execution/decisions` (Prompt 8) for the AI-assisted decision registry and noise diagnostics, and `/finance` (Prompt 9) for budget tracking + AI forecasting.
- `/login`, `/execution/projects`, and `/execution/decisions` are now backed by lightweight Next.js API routes plus React Query hooks, so UI flows exercise real request/response paths even before the Express/tRPC APIs land.
- `pnpm --filter web build` passes, so the Next.js frontend is production-build ready after the most recent UI refresh.
- Back-end services and agents remain unchanged from the initial import; no additional migrations or schema updates were required for this UI iteration.
- The global toast event bus (`apps/web/hooks/use-toast.ts`) now drives the in-app `ToastViewport`, so any feature can dispatch cross-cutting success/error notifications without pulling in an external UI kit.

- `/intelligence/agents` (Prompt 10) now surfaces the multi-agent operations cockpit with confidence metrics, performance charting, and inline configuration controls for each autonomous copilot.
- `/mobile/warehouse` (Prompt 11) delivers the mobile-first warehouse companion with live shift stats, task queue, scanner hand-off, dock visibility, and quick action tiles.
- `/composer` (Prompt 12) introduces the low-code workflow composer with drag-and-drop component library, canvas visualization, live validation wiring, and contextual properties editor for each node.
- `/profile` now centralizes user settings with universal General/Security/Notification tabs, super-admin Platform controls, tenant Organization management, personalization preferences, and audit-ready activity history.
- `/pricing` introduces the Business Model Agent marketing surface with transparent seat-based pricing, feature comparison, ROI modeling, FAQ, and CTA blocks wired to the new calculator component.
- `/super-admin/business-model` provides the monetization command center with ARR metrics, revenue composition, RevEx forecasting toggles, cohort tables, and pricing experiment tracking for operations leadership.
- `apps/api/src/routers/procurement.router.ts` now writes directly to the Prisma `PurchaseOrder`, `PurchaseOrderItem`, and `AuditLog` tables. Clients must supply `tenantId`, `supplierId`, and a `plantId`/`facilityId` that already exists in the master data plus valid material numbers for every PO line.
- `apps/api/src/routers/logistics.router.ts` now persists shipments as `HandlingUnit` rows, stores cold-chain telemetry, emits Inventory Alerts on threshold breaches, and saves generated paperwork into the `Document` table. Every call requires a `tenantId` so the data lands in the correct partition.
- `/pharma/validation` (Prompt 1) provides the GMP validation cockpit with release queue telemetry, cold-chain risk segmentation, and AI QA copilot actions.
- `/manufacturing/shopfloor` (Prompt 2) unlocks the precision manufacturing console covering OEE breakdowns, cell timelines, and automation recommendations.
- `/retail/operations` (Prompt 3) adds the omni-channel operations hub with channel mix analytics, fulfillment waves, and promo/loyalty experiments.
- Pharma, precision manufacturing, and retail Prisma modules now live under `apps/api/src/modules/*`, capturing release dossiers, CNC telemetry, and omni-channel fulfillment data structures that back the new dashboards.

- `/hcm` (Prompt 1 refresh) delivers workforce intelligence with KPI cards, allocation conflicts, training readiness, and AI insight briefs for the CHRO pod.
- `/execution/comms` (Prompt 2 refresh) replaces Slack-style chatter with channel health, linked context, and AI noise filters for execution teams.
- `/execution/pmo` (Prompt 3) now houses the portfolio management cockpit featuring live Gantt view, risk segmentation, and dependency tracking.
- `/admin/migration` (Prompt 4) introduces the modernization toolkit spanning wave orchestration, cold-chain telemetry, and decision copilot recommendations.
- `/operations/production` (Prompt 1 production module) layers BOM consumption, line telemetry, QA checkpoints, and shop-floor activity for live manufacturing control.
- `/operations/procurement` (Prompt 2 procurement module) centralizes PO triage, supplier health, approvals, and AI sourcing insights.
- `/operations/logistics` (Prompt 5 TMS module) tracks deliveries, optimized routes, fleet utilization, and cold-chain alerts for the transportation team.
- `/operations/physical-inventory` (Prompt 4 SAP add-on) now replaces LI01N/LI11N/LI14/LI21 with a single AI-assisted command center covering document orchestration, scanner/mobile counting, variance intelligence, and ABC cadence governance.
- `/operations/stock-transfers` (Prompt 5 SAP add-on) manages inter-plant/inter-company STOs with item-level ATP, logistics, documents, and stock comparison checks.
- `/operations/goods-movement` replaces SAP MB*/LT* with a unified control tower that covers MIGO posting, MB03/51 audit trails, LT01/10 transfer orchestration, HU/SU label workbench, FEFO-aware AI guardrails, and cold-chain/allergen telemetry.
- `/sales/orders` replaces SAP SD (VA01/VA02, VL01N/VL02N, VF01/VF04) with a unified AI sales & distribution control tower covering order capture, ATP, credit, delivery orchestration, billing automation, and decision analytics.
- `/navigation/tcode` (Prompt 6 SAP add-on) delivers the T-code quick launch workspace with favorites, recent history, module directory, and workflow shortcuts.
- `/planning/mrp` (Prompt 1) introduces the SAP-grade MRP + capacity cockpit with shortage detection, planned order conversion, and line bottleneck telemetry.
- `/portal` (Prompt 3 partner portal) gives suppliers/3PLs a consolidated dashboard for orders, shipments, docs, and analytics entry points.
- `/admin/settings` (Prompt 4 settings hub) now centralizes platform configuration, users, security, integrations, billing, and module toggles.
- `/notifications` (Prompt 6 alerts center) unifies alerts/notifications with severity filters, stats, and inline actions across copilots.
- `/super-admin/disaster-recovery` adds the enterprise DR & continuity center with RTO/RPO telemetry, multi-region backups, and point-in-time recovery tooling.
- `/super-admin/apm` streams live APM/observability with response KPIs, resource monitors, slow transaction drilling, and alert feeds.
- `/audit` delivers the regulated audit trail, compliance scorecards, and CFR Part 11 signature ledger.
- `/change-management` orchestrates approvals, deployment versions, and rollback-ready change controls.
- `/data-governance` centralizes MDM stewardship with quality metrics, classification, and rule enforcement dashboards.
- `/industries/food-beverage/transactions` (Prompt 1 industry module) captures end-to-end F&B workflows spanning receiving, production, QA release, shelf life, and recall execution with typed transaction states.
- `/industries/pharmaceutical/transactions` (Prompt 2 industry module) layers dispensing, compounding, fill-finish, QA validation, clinical supply, and cold-chain control workflows for GMP-grade pharma operations.
- `/industries/manufacturing/transactions` (Prompt 3 industry module) provides precision manufacturing transactions for CNC machining, additive cells, QA checkpoints, assembly, maintenance, and tooling orchestration.
- `/industries/retail/transactions` (Prompt 4 industry module) delivers omni-channel retail flows across BOPIS, POS, transfers, returns/exchanges, price intelligence, and customer service recovery.
- `/industries/healthcare/transactions` (Prompt 5 industry module) tracks acute care admissions, perioperative cases, medication safety, critical labs, discharge coordination, and implant supply chain traceability.
- `/finance/period-close` (Prompt 1) introduces the SAP-inspired period-end cockpit with status timeline, checklist swimlanes, and blocker tracking for close orchestration.
- `/employee/self-service` (Prompt 2) brings the ADP-style portal with payroll insights, time-off management, timesheets, benefits, and actionable employee tasks.
- `/collaboration/workspace` (Prompt 3) mirrors the Slack operations workspace with channels, direct messages, rich message blocks, reactions, and thread previews.
- `/master-data/materials` (Prompt 2) centralizes materials, vendors, BOM hierarchies, work centers, and routings for holistic master data governance.
- `/master-data` (Prompt 3) replaces SAP XD/XK customer/vendor masters with AI cleansing, golden records, and deduplication workflows.
- `/operations/batch-management` (Prompt 3) delivers bidirectional batch genealogy, movement history, and recall readiness KPIs for QA traceability drills.

## Offline + mobile readiness

- `apps/web` now ships with a full PWA manifest plus a `next-pwa` service worker. Install the control tower from Chromium, Edge, or Safari to cache key dashboards, tiles, and copilots. Requests to `/api/*` use a Network-First cache strategy with graceful `/offline` fallbacks so teams stay oriented during outages.
- `apps/mobile` persists every dock/putaway/ASN scan into an encrypted AsyncStorage queue whenever connectivity or auth checks fail. Operators see the pending count inline and can force syncs the moment coverage returns.

## Next steps

1. Gather any revised prompt copy or new feature requirements for the operations dashboard, execution suite, or finance flows and mirror them in the corresponding App Router routes.
2. Replace the interim Next.js API mocks with calls to the Express/tRPC services (auth, execution orchestration, decision intelligence, finance) once those endpoints are available.
3. Re-run the web build and top-level turborepo pipelines (`pnpm build`, `pnpm lint`, `pnpm test`) once new integrations land to keep the monorepo healthy.

## License

Proprietary – internal use for the Oonru program.
