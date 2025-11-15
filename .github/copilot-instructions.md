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

- [x] Compile the Project
	- Install dependencies, run diagnostics, and fix build issues.
	- Consult repository markdown files for project-specific guidance.

- [ ] Create and Run Task
	- Create VS Code tasks only when required by project tooling docs.
	- Reference `package.json`, `README.md`, and structure to define the command.

- [ ] Launch the Project
	- Only launch or debug after confirming the user wants it.

- [ ] Ensure Documentation is Complete
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

- **Task Completion Rules**
  - Project scaffolding must compile without errors.
  - Keep this instructions file and README up to date.
  - Provide clear launch/debug instructions before considering the task complete.
- Work through each checklist item systematically.
- Keep communication concise and focused.
- Follow development best practices.
