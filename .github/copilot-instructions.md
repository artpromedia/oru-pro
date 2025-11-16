- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements
	- Completed via user-provided monorepo spec (Next.js, Express/tRPC, Python FastAPI services, pnpm workspaces).

- [x] Scaffold the Project
	- Ensure prior steps are complete before scaffolding.
	- Use project setup tool with `projectType` when available and run scaffolding in `.`.
	- If tooling is unavailable, create the structure manually following the provided specification.

- [x] Customize the Project
	- Confirm earlier steps are done.
  - Develop a plan, then implement required modifications.
  - Phase 4 agents + decision intelligence delivered (inventory/production copilots, decision engine, DecisionWizard UI).
  - Skip only for trivial hello-world scaffolds.

- [ ] Install Required Extensions
  - Install only the extensions specified by `get_project_setup_info`.
  - Pending: no extension list available because the setup-info tool can't be invoked post-initialization.

- [x] Compile the Project
	- Install dependencies, run diagnostics, and fix build issues.
	- Consult repository markdown files for project-specific guidance.

- [ ] Create and Run Task
  - Create VS Code tasks only when required by project tooling docs.
  - Reference `package.json`, `README.md`, and structure to define the command.
  - Status: Not required yet; README only calls for direct pnpm commands.

- [ ] Launch the Project
	- Only launch or debug after confirming the user wants it.

- [x] Ensure Documentation is Complete
	- Ensure README.md and this file stay updated with current project info.
	- Keep this document free of HTML comments (already enforced).

- **Execution Guidelines**
  - Track progress with the todo list tool; update status and summaries per step.
  - Keep explanations concise; skip steps only with a short justification.

- **Development Rules**
  - Work from the repo root (.) unless told otherwise.
  - Avoid extra media/links and call VS Code APIs only for extension projects.
  - Never instruct users to reopen the project in VS Code; it's already open.
  - Follow any additional rules specified by project setup docs.

- **Folder Creation Rules**
  - Treat the repo root as the project root.
  - Run commands with `.` to guarantee the correct working directory.
  - Only create new folders when explicitly requested (besides `.vscode` for tasks).
  - If scaffolding requires a differently named folder, inform the user to rename/reopen.

- **Extension Installation Rules**
  - Install only the extensions explicitly requested via `get_project_setup_info`.

- **Project Content Rules**
  - Default to a "Hello World" scope if requirements are unspecified.
  - Add placeholders only when necessary and note they need replacement.
  - Ensure each generated component has a clear purpose.
  - Ask for clarification before adding assumed features.
  - Consult VS Code API docs when building VS Code extensions.

- **Prompt Coverage Updates**
  - `/pharma/validation` implements Prompt 1's GMP validation cockpit with release queue telemetry, cold-chain risk segmentation, and QA copilot recommendations.
  - `/manufacturing/shopfloor` implements Prompt 2's precision manufacturing console with cell-level OEE, changeover automation, and AI optimization queue.
  - `/retail/operations` implements Prompt 3's omni-channel operations hub with channel mix analytics, fulfillment waves, and loyalty/promo experiments.
  - `/intelligence/agents` implements Prompt 10's agent management & monitoring dashboard with active agent roster, decision telemetry, and control panel.
  - `/mobile/warehouse` implements Prompt 11's warehouse companion optimized for mobile crews with scanning workflow, route guidance, and dock visibility.
  - `/composer` implements Prompt 12's drag-and-drop workflow composer with component library, canvas, live validation, and node property inspector.
  - `/hcm` implements the refreshed Prompt 1 HCM control tower with allocation conflicts, training readiness, and AI coaching cards.
  - `/execution/comms` implements Prompt 2's communications hub with channel KPIs, linked context drawer, and AI noise filters.
  - `/execution/pmo` implements Prompt 3's PMO cockpit with portfolio health, Gantt view, and risk/dependency matrices.
  - `/admin/migration` implements Prompt 4's migration command center with wave orchestration, telemetry, and decision copilot guidance.
  - `/operations/production` implements Prompt 1's production module with BOM oversight, line telemetry, and QA checkpoints.
  - `/operations/procurement` implements Prompt 2's procurement module with supplier health, PO triage, and AI sourcing insights.
  - `/operations/logistics` implements Prompt 5's TMS dashboard with delivery tracking, route optimization, fleet status, and cold-chain alerts.
  - `/operations/physical-inventory` implements Prompt 4's physical inventory + cycle counting cockpit with variance clearing, scheduling, and ABC controls.
  - `/operations/stock-transfers` implements Prompt 5's STO console with inter-plant logistics, ATP checks, and reconciliation telemetry.
  - `/navigation/tcode` implements Prompt 6's SAP T-code quick access workspace with favorites, recents, module filters, and workflow shortcuts.
  - `/planning/mrp` implements Prompt 1's MRP + capacity planning cockpit with shortage surfacing, planned orders, and bottleneck alerts.
  - `/portal` implements Prompt 3's partner portal with supplier/3PL dashboards for orders, shipments, and compliance docs.
  - `/admin/settings` implements Prompt 4's administration cockpit with org settings, users, security, integrations, and billing controls.
  - `/notifications` implements Prompt 6's alerts center with unified filtering, severity badges, and inline actions.
  - `/super-admin/disaster-recovery` implements enterprise DR & business continuity with RTO/RPO telemetry, multi-region backups, and PITR workflows.
  - `/super-admin/apm` implements the observability hub with APM metrics, resource monitors, slow-transaction drilldowns, and alert routing.
  - `/audit` implements the advanced audit trail cockpit with compliance scorecards and CFR Part 11 signature tracking.
  - `/change-management` implements the change-control workspace with approvals, scheduling, and version rollback details.
  - `/data-governance` implements the MDM/data quality console with stewardship metrics, classification, and automated rule enforcement.
  - `/forge` implements the Oonru Forge marketplace, installed extensions view, developer SDK catalog, and live code builder for partner apps.
  - `/migration/sap` implements the SAP migration kit with connection orchestration, module selection, phase tracking, and mapping previews.
  - `/documents` implements the AI document management cockpit with drag/drop uploads, compliance tagging, and inline controls; `/api/v1/documents` plus `apps/web/lib/storage`, `apps/web/lib/ai/document-processor.ts`, and `apps/web/lib/compliance` power secure uploads, AI enrichment, auditing, and search indexing.
  - `/industries/food-beverage/transactions` implements Prompt 1's end-to-end F&B transaction cockpit with receiving, production, QA release, shelf-life, and recall workflows.
  - `/industries/pharmaceutical/transactions` implements Prompt 2's pharma transaction hub with dispensing, compounding, fill-finish, validation, clinical supply, and cold-chain controls.
  - `/industries/manufacturing/transactions` implements Prompt 3's precision manufacturing transaction cockpit with CNC, additive, QC, assembly, maintenance, and tooling workflows.
  - `/industries/retail/transactions` implements Prompt 4's retail & e-commerce transaction hub covering omnichannel orders, POS, transfers, returns, price markdowns, and customer service recovery.
  - `/industries/healthcare/transactions` implements Prompt 5's healthcare provider cockpit for admissions, surgeries, medication safety, critical labs, discharge planning, and implant logistics.
  - `/master-data/materials` implements Prompt 2's master data control tower aggregating materials, vendors, BOMs, work centers, and routings.
  - `/operations/batch-management` implements Prompt 3's batch traceability workspace with genealogy, movements, and recall readiness metrics.
  - `/pricing` implements the Business Model Agent marketing experience with seat calculator, plan matrix, ROI calculator, and FAQ/CTA blocks.
  - `/super-admin/business-model` implements the monetization command center with ARR metrics, cohort analytics, RevEx toggles, and pricing experiment tracking.
  - `/api/auth/*` + `apps/web/lib/auth` + `apps/web/middleware.ts` deliver the tenant-scoped login + MFA pipeline with JWT issuance, Redis audit events, and middleware enforcement.

- **Task Completion Rules**
  - Project scaffolding must compile without errors.
  - Keep this instructions file and README up to date.
  - Provide clear launch/debug instructions before considering the task complete.
- Work through each checklist item systematically.
- Keep communication concise and focused.
- Follow development best practices.
