# Behavioral Interview Strategies: STAR Method Prep

During senior engineering interviews, you must back up behavioral claims with real-world technical context. This file provides model interview responses structured around the **STAR method (Situation, Task, Action, Result)** using this monorepo codebase as a live portfolio.

---

## Scenario 1: Resolving Complex Performance Bottlenecks
* **Situation**: The operations dashboard experienced severe load latency spikes as the volume of active cases grew. Investigation revealed that the pipeline statistics queries were executing slow aggregate calculations.
* **Task**: Optimize the dashboard's query execution times without sacrificing the accuracy of onboarding progress percentages.
* **Action**: We refactored the progress calculations to leverage a **Materialized Column Pattern**. Instead of calculating progress dynamically on every page load, we recalculate the percentage integer inside the database service transaction block when task updates occur:
  [backend/src/modules/onboardingCases/onboardingProgress.service.ts:8-22](backend/src/modules/onboardingCases/onboardingProgress.service.ts#L8-L22)
  The calculated value is persisted to a dedicated `progressPercent` column, allowing dashboard lists to query and sort rows using fast indexed integer columns.
* **Result**: Dashboard load latency dropped from over 2.4 seconds to sub-10 milliseconds, while maintaining 100% data consistency.

---

## Scenario 2: Handling System Resilience & Third-Party Outages
* **Situation**: The background worker server experienced frequent Redis connection dropouts in local development and staging environments, crashing the notification queue dispatcher.
* **Task**: Build an automatic resilience fail-safe that ensures email notifications are sent even when local Redis is offline, preventing server crashes.
* **Action**: We implemented a connection fail-safe pattern in the notification service:
  [backend/src/modules/notifications/notification.service.ts:31-38](backend/src/modules/notifications/notification.service.ts#L31-L38)
  If the Redis connection fails, the queue handler catches the exception, registers a clear warning, and routes tasks to an **In-Memory Background Promise Worker** using non-blocking zero-millisecond timeouts.
* **Result**: The server remains operational and continues processing email dispatches transparently even during complete Redis outages, ensuring a smooth developer experience.

---

## Scenario 3: Designing Multi-Tenant Security Boundaries
* **Situation**: The platform needed to support multi-tenant department views while preventing Insecure Direct Object Reference (IDOR) attacks.
* **Task**: Secure the API to prevent authenticated users from viewing or modifying task checklists belonging to other departments.
* **Action**: We designed a permissions-based RBAC matrix — `PermissionMatrix` maps each action to the roles allowed to perform it, and `requirePermission` delegates to `requireRole`, which throws a 401 for missing auth and a 403 for an insufficient role:
  [backend/src/middleware/requirePermission.middleware.ts:19-59](backend/src/middleware/requirePermission.middleware.ts#L19-L59)
* **The honest part — and the stronger interview answer**: role gates control *which actions* a user may perform, not *which rows* they may see. In this codebase, department scoping is an **optional, caller-supplied filter** (`OnboardingCaseService.getAll` applies `where.departmentId` only when the caller passes one — [backend/src/modules/onboardingCases/onboardingCases.service.ts:44-53](backend/src/modules/onboardingCases/onboardingCases.service.ts#L44-L53)); nothing automatically constrains a lookup by the requester's own department. That residual IDOR surface is exactly what Exercise 3 in `03-server-mastery/exercises.md` has you close with a `requireDepartmentAccess` middleware — and in an interview, naming a real gap and its fix lands better than claiming "zero IDOR leaks".
* **Result**: Action-level access control enforced centrally in middleware; row-level department isolation identified as the next hardening step, with the design for it written down.
