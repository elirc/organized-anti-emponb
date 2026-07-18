# Weekend Fast-Track Guide: Quick Workspace Orientation

This fast-track version is tailored for time-constrained developers or seniors who need to get oriented with the platform's core mechanics in a single weekend. 

---

## Timed Training Modules

### Block 1: Codebase Reconnaissance & Boot (Saturday 09:00 - 10:30)
* **Goal**: Establish a working local instance and inspect the high-level layout.
* **Steps**:
  1. Boot the backend server in dev mode by running `npm run dev:backend` inside the root directory.
  2. Boot the client application by running `npm run dev:frontend` in a separate terminal.
  3. Validate database synchronization by executing migrations against the sqlite engine: `npx prisma db seed` inside `backend`.
  4. Verify the frontend app is listening on `http://localhost:5173`.

---

### Block 2: Trace the Primary Feature Thread (Saturday 11:00 - 13:00)
* **Goal**: Understand the complete UI-to-DB path by tracing a workflow case start action.
* **Trace path**:
  1. **UI Launch Trigger**: Inspect how the click handler triggers `handleStartWorkflow` inside [frontend/src/pages/CasesList.tsx:106-113](frontend/src/pages/CasesList.tsx#L106-L113) which calls the api router.
  2. **API Endpoint**: Trace the request as it hits the backend router inside [backend/src/modules/onboardingCases/onboardingCases.routes.ts:31-34](backend/src/modules/onboardingCases/onboardingCases.routes.ts#L31-L34).
  3. **Controller Guard**: See how the controller invokes the service inside [backend/src/modules/onboardingCases/onboardingCases.controller.ts:47-59](backend/src/modules/onboardingCases/onboardingCases.controller.ts#L47-L59).
  4. **Transactional Business Logic**: Follow the service as it starts a transaction, resolves default assignees, writes tasks, updates status, and logs audit events under `backend/src/modules/onboardingCases/onboardingCases.service.ts:236-335`.

---

### Block 3: Make Your First Code Revision (Saturday 14:30 - 17:00)
* **Goal**: Write and execute a code update to understand state machine transition limits.
* **Steps**:
  1. Open the case state machine at [backend/src/modules/onboardingCases/onboardingCase.stateMachine.ts:16-24](backend/src/modules/onboardingCases/onboardingCase.stateMachine.ts#L16-L24).
  2. Modify the allowed transitions to let a case transition directly from `DRAFT` to `COMPLETED` for rapid-onboarding tracks.
  3. Run the Vitest unit tests inside `backend` with `npm run test` and watch the state machine validation tests fail due to the change.
  4. Revert the modification to restore system integrity.

---

### Block 4: Inspect the Operations Analytics (Sunday 10:00 - 12:30)
* **Goal**: Track how operational statistics are calculated and displayed on the client.
* **Steps**:
  1. Inspect how the reporting endpoints aggregate database records inside [backend/src/modules/reports/reports.service.ts:7-32](backend/src/modules/reports/reports.service.ts#L7-L32).
  2. Walk through the front-end reports dashboard at [frontend/src/pages/Reports.tsx:133-162](frontend/src/pages/Reports.tsx#L133-L162) to see how pipeline stage allocations and status counters are rendered.

---

### Block 5: Core Critical Critique (Sunday 14:00 - 16:30)
* **Goal**: Review codebase limitations, compromises, and design choices.
* **Steps**:
  1. Open [docsclaude/CRITIQUE.md](CRITIQUE.md) to read about known codebase fragilities, such as using SQLite as a single-point-of-failure engine, or utilizing memory fallbacks in place of dedicated queues.
  2. Formulate your own review notes on how you would refactor these modules.
