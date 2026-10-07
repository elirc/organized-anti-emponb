# The Tracing Lab: 10 Reading Katas

To master an unfamiliar codebase, you must learn to read it systematically. These ten reading katas require you to trace specific, physical execution paths across our monorepo workspace, explaining their runtime behavior in your own words.

---

## Kata 1: Case Lifecycle Guard State Machine
* **File Anchor**: [backend/src/modules/onboardingCases/onboardingCase.stateMachine.ts:16-24](backend/src/modules/onboardingCases/onboardingCase.stateMachine.ts#L16-L24)
* **Goal**: Trace how the case state machine blocks invalid status updates.
* **Question**: Explain how `allowedCaseTransitions` prevents a case from moving from `DRAFT` directly to `COMPLETED`. What exact error exception is thrown when an invalid transition is attempted?

---

## Kata 2: Onboarding Case Initialization Transaction
* **File Anchor**: [backend/src/modules/onboardingCases/onboardingCases.service.ts:98-132](backend/src/modules/onboardingCases/onboardingCases.service.ts#L98-L132)
* **Goal**: Analyze the database transactional boundaries during case creation.
* **Question**: Identify why creating a case requires a database transaction. If the subsequent audit log creation fails, how does the system ensure the case record is not left orphan in the database?

---

## Kata 3: Derived Progress Recalculations
* **File Anchor**: [backend/src/modules/onboardingCases/onboardingProgress.service.ts:8-28](backend/src/modules/onboardingCases/onboardingProgress.service.ts#L8-L28)
* **Goal**: Trace the derived progress mathematics.
* **Question**: Walk through the code and describe how the percentage integer is calculated. How does the calculation handleskipped tasks versus completed tasks?

---

## Kata 4: Task Completion Approval Spawner
* **File Anchor**: [backend/src/modules/onboardingTasks/onboardingTasks.service.ts:114-142](backend/src/modules/onboardingTasks/onboardingTasks.service.ts#L114-L142)
* **Goal**: Trace how task updates trigger manager approvals.
* **Question**: If a task is marked `COMPLETED` but requires manager approval, how does this method override the status? Where is the pending approval record written?

---

## Kata 5: Background worker Redis Connection Fallback
* **File Anchor**: [backend/src/modules/notifications/notification.service.ts:31-38](backend/src/modules/notifications/notification.service.ts#L31-L38)
* **Goal**: Study queue resilience strategies.
* **Question**: If the Redis database server crashes during an operations action, explain how the event loop fallback preserves email notification delivery.

---

## Kata 6: Unified Request Validation Middleware
* **File Anchor**: [backend/src/middleware/validate.middleware.ts:4-17](backend/src/middleware/validate.middleware.ts#L4-L17)
* **Goal**: Trace request sanitization gates.
* **Question**: Trick question — this helper never builds the client payload. Trace where a `ZodError` thrown by `schema.parse` actually becomes JSON (follow `next(error)` into `error.middleware.ts`). What HTTP status code is returned, and which function flattens the field errors?

---

## Kata 7: Role Permissions Verification Matrix
* **File Anchor**: [backend/src/middleware/requirePermission.middleware.ts:19-51](backend/src/middleware/requirePermission.middleware.ts#L19-L51)
* **Goal**: Trace access boundary controls.
* **Question**: Describe how the permission matrix verifies a user's rights. What happens if `req.user` is undefined when the gate executes?

---

## Kata 8: Axios Rolling Session Refresh Interceptor
* **File Anchor**: [frontend/src/utils/api.ts:40-49](frontend/src/utils/api.ts#L40-L49)
* **Goal**: Trace client-side session rotations.
* **Question**: Describe how the interceptor handles a `401 Unauthorized` response. How does the `_retry` flag prevent infinite network callback loops?

---

## Kata 9: Authentication Global State Cache
* **File Anchor**: [frontend/src/stores/authStore.ts:36-50](frontend/src/stores/authStore.ts#L36-L50)
* **Goal**: Map Zustand state caching.
* **Question**: Explain how Zustand persists session data inside the browser's storage layers. What action is executed during user logout?

---

## Kata 10: Reports Aggregated Status Counts
* **File Anchor**: [backend/src/modules/reports/reports.service.ts:7-14](backend/src/modules/reports/reports.service.ts#L7-L14)
* **Goal**: Study optimized SQL aggregations.
* **Question**: Walk through the Prisma `groupBy` call. What SQL statement does this group aggregation map to, and why is it faster than fetching raw rows?
