# Codebase Modification Tickets: 10 Progressive Assignments

Transitioning to a senior engineer requires writing modifications that blend into the codebase's existing architecture. These ten progressive assignments require you to write, test, and verify code updates across the monorepos.

---

## 1. Easy: Case Schema Start Date Guard
* **Target File**: [backend/src/modules/onboardingCases/onboardingCases.schemas.ts:6-14](backend/src/modules/onboardingCases/onboardingCases.schemas.ts#L6-L14)
* **Goal**: Prevent launching onboarding workflows with historical start dates.
* **Requirements**: Refactor the Zod schema constraint for `startDate` to reject any date that is earlier than today's date, displaying the custom warning message `"Start date cannot be in the past"`.

---

## 2. Easy: Trim Preferred Name Input
* **Target File**: [backend/src/modules/onboardingCases/onboardingCases.schemas.ts:6-14](backend/src/modules/onboardingCases/onboardingCases.schemas.ts#L6-L14)
* **Goal**: Clean up user input automatically before database writes.
* **Requirements**: Use Zod's `trim()` filter on input text fields to automatically strip trailing and leading white spaces before records are parsed.

---

## 3. Medium: IT Hardware Checklist Auto-generation
* **Target File**: [backend/src/modules/onboardingCases/onboardingCases.service.ts:250-280](backend/src/modules/onboardingCases/onboardingCases.service.ts#L250-L280)
* **Goal**: Modify the case initialization transaction loop.
* **Requirements**: When a case is started, if the associated department name is "IT", append a default task item `"Allocate Developer Laptop"` directly inside the interactive transaction write block.

---

## 4. Medium: Audit Logging for Reassignments
* **Target File**: [backend/src/modules/onboardingTasks/onboardingTasks.service.ts:190-210](backend/src/modules/onboardingTasks/onboardingTasks.service.ts#L190-L210)
* **Goal**: Extend the compliance audit log.
* **Requirements**: Locate the task assignee reassignment method. Add a database write step inside the update block to log a compliance audit entry `"TASK_REASSIGNED"` containing the previous and new assignee IDs in the metadata payload.

---

## 5. Medium: Skip State Machine Transition Check
* **Target File**: [backend/src/modules/onboardingTasks/onboardingTasks.service.ts:114-142](backend/src/modules/onboardingTasks/onboardingTasks.service.ts#L114-L142)
* **Goal**: Adjust task update rules.
* **Requirements**: Allow a task status update to bypass the standard completion check if the new state is explicitly marked as `SKIPPED`.

---

## 6. Hard: Max Task Allocations Limit
* **Target File**: [backend/src/modules/onboardingTasks/onboardingTasks.service.ts:75-95](backend/src/modules/onboardingTasks/onboardingTasks.service.ts#L75-L95)
* **Goal**: Prevent user assignment overload.
* **Requirements**: When assigning a task, verify the target user's active task load. If they currently hold more than 20 unfinished tasks, block the assignment and throw an `AppError` with a `400 Bad Request` status.

---

## 7. Hard: Reports Overdue Counts
* **Target File**: [backend/src/modules/reports/reports.service.ts:7-32](backend/src/modules/reports/reports.service.ts#L7-L32)
* **Goal**: Extend operational metrics.
* **Requirements**: Refactor the reporting query to calculate the count of active onboarding cases whose `startDate` has already passed but whose status is not yet `COMPLETED`.

---

## 8. Hard: Custom RBAC Role Implementation
* **Target File**: [backend/src/middleware/requirePermission.middleware.ts:6-30](backend/src/middleware/requirePermission.middleware.ts#L6-L30)
* **Goal**: Register a new platform security role.
* **Requirements**: Add a new role `AUDITOR` to the permission matrix. The Auditor must hold permissions to view cases and audit logs but must be completely blocked from creating or modifying tasks.

---

## 9. Expert: Bulk Checklist Task Reassignment Transaction
* **Target File**: [backend/src/modules/onboardingTasks/onboardingTasks.service.ts:190-230](backend/src/modules/onboardingTasks/onboardingTasks.service.ts#L190-L230)
* **Goal**: Build a highly performant bulk database action.
* **Requirements**: Create an endpoint that accepts an array of task IDs and a single user ID, reassigning all targeted tasks to that user in a single interactive transaction block.

---

## 10. Expert: SLA Tracking Engine with Materialization
* **Target File**: [backend/src/modules/onboardingCases/onboardingProgress.service.ts:8-58](backend/src/modules/onboardingCases/onboardingProgress.service.ts#L8-L58)
* **Goal**: Build a complex, materialized derived calculation engine.
* **Requirements**: Extend the progress recalculation engine to compute whether the onboarding case has breached its SLA timeline (defined as 30 days post start date). Persist this Boolean status to a new `slaBreached` column in the case table.
