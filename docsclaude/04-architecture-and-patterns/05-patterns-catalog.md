# Blueprints, Structs, and Invariants: Patterns Catalog

Design patterns are reusable solutions to common software development problems. Our platform implements ten distinct structural blueprints to enforce type safety, transactional integrity, and visual separation of concerns.

---

## 1. Singleton Database Client Pattern
* **File Anchor**: [backend/src/db/prisma.ts:7-14](backend/src/db/prisma.ts#L7-L14)
* **Description**: Instantiates the Prisma connection engine exactly once and caches the reference globally. This ensures that the application maintains a single connection pool across its lifecycle, preventing connection exhaustion under concurrent traffic spikes.

---

## 2. State Machine Transitions Engine Pattern
* **File Anchor**: [backend/src/modules/onboardingCases/onboardingCase.stateMachine.ts:16-24](backend/src/modules/onboardingCases/onboardingCase.stateMachine.ts#L16-L24)
* **Description**: Declares state changes inside a strict lookup matrix and verifies updates before execution. This prevents invalid lifecycle flows (like changing a `COMPLETED` case back to `DRAFT`) and protects historical records from corrupting state mutations.

---

## 3. Asynchronous Queue Fallback Pattern
* **File Anchor**: [backend/src/modules/notifications/notification.service.ts:31-38](backend/src/modules/notifications/notification.service.ts#L31-L38)
* **Description**: Intercepts queue connection errors and transparently routes tasks to an **In-Memory Background Promise Worker**. This ensures the server remains functional and continues processing notifications even when the local Redis instance is offline.

---

## 4. Interactive Transaction boundaries Pattern
* **File Anchor**: [backend/src/modules/onboardingCases/onboardingCases.service.ts:236-239](backend/src/modules/onboardingCases/onboardingCases.service.ts#L236-L239)
* **Description**: Wraps sequential updates (like generating tasks, altering statuses, and writing audit logs) in a unified database transaction. If any sub-query fails, the entire transaction is rolled back, guaranteeing database consistency.

---

## 5. Eager Loading Relations Pattern
* **File Anchor**: [backend/src/modules/onboardingCases/onboardingCases.service.ts:65-71](backend/src/modules/onboardingCases/onboardingCases.service.ts#L65-L71)
* **Description**: Configures `include` statements to eager-load related child records (such as departments or employee profiles) directly in the database lookup. This resolves N+1 query traps by fetching child data in a single optimized database join query.

---

## 6. Zod Request Validator Middleware Pattern
* **File Anchor**: [backend/src/shared/middleware/validation.middleware.ts:6-14](backend/src/shared/middleware/validation.middleware.ts#L6-L14)
* **Description**: Parses incoming HTTP request bodies against strict Zod schemas inside route handler chains. This rejects malformed payloads immediately with a `400 Bad Request` before the controller action is even invoked.

---

## 7. Permission-Based RBAC Gate Pattern
* **File Anchor**: [backend/src/shared/middleware/requirePermission.middleware.ts:31-38](backend/src/shared/middleware/requirePermission.middleware.ts#L31-L38)
* **Description**: Verifies that the authenticated user holds specific permissions before granting access. This decouples user roles from platform features, allowing permissions to be updated without modifying routing code.

---

## 8. Axios Automatic Session Refresher Interceptor Pattern
* **File Anchor**: [frontend/src/utils/api.ts:40-49](frontend/src/utils/api.ts#L40-L49)
* **Description**: Intercepts `401 Unauthorized` responses, transparently requests a new access token from the backend, and retries the original request. This maintains active user sessions without interrupting the user's flow.

---

## 9. Global Store Persistence Pattern
* **File Anchor**: [frontend/src/stores/authStore.ts:36-39](frontend/src/stores/authStore.ts#L36-L39)
* **Description**: Leverages Zustand middleware to automatically serialize the authentication state store to `localStorage`. This preserves session state across page reloads and browser restarts.

---

## 10. Global Exception Boundary Translation Pattern
* **File Anchor**: [backend/src/shared/middleware/errorHandler.ts:11-20](backend/src/shared/middleware/errorHandler.ts#L11-L20)
* **Description**: Centralizes error handling by catching all thrown exceptions and translating them into structured JSON error payloads. This prevents raw database error leaks and presents clean, actionable feedback to the frontend.

---

## Pitfall Checklist

1. **Anti-Pattern: Singleton Bypass**: Re-instantiating client connections inside multiple files instead of utilizing global singleton exports.
2. **Anti-Pattern: Manual Try/Catch Duplication**: Writing redundant try/catch error-logging logic in every controller instead of relying on global exception boundaries.
3. **Anti-Pattern: Loose State Machine Validation**: Updating case or task states directly in database queries without routing them through state machine transition checks first.
4. **Anti-Pattern: Static Role Checking**: Writing hardcoded `if (user.role === 'HR')` gates inside controllers instead of using permission-based RBAC gates.
5. **Anti-Pattern: Unvalidated Payload Acceptance**: Trusting incoming HTTP request bodies without sanitizing them against Zod validation schemas.

---

## Drills

1. **Pattern Catalog Review**: Review the 10 cataloged patterns and verify their existence in the referenced files.
2. **Singleton Validation**: Write a scratch script that imports the database client from multiple files and verify that only a single active connection pool is created.
3. **State Machine Verification**: Write a unit test script that attempts to force an invalid state transition on a case, and verify that the state machine engine correctly rejects the update.
