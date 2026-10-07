# Module 03 Practice Drills: Backend Systems & Data Integrity

Analyze each drill, write down your prediction or code refactoring strategy, execute the code, and evaluate your understanding using the self-grading rubric.

---

## Self-Grading Rubric
* **0 - No Attempt**: No code written or predictions made.
* **1 - Minor Gaps**: Attempted the task but missed key database constraints or authorization rules.
* **2 - Correct with Reference Help**: Successfully completed the challenge, but had to reference module files or schema configurations.
* **3 - Complete Mastery**: Solved the challenge quickly and can explain transaction rollbacks or permissions mapping flawlessly.

---

## Exercise 1: Transaction Rollback Inspection (Concept: Databases)

Inspect this transaction block written by a developer:

```ts
// Illustrative — not from the repo
await prisma.$transaction(async (tx) => {
  await tx.onboardingCase.create({
    data: { id: "case-01", status: "NOT_STARTED", ... }
  });

  // WRONG: Using the root prisma client instead of tx!
  const defaultUser = await prisma.user.findFirst({
    where: { role: "IT" }
  });

  if (!defaultUser) {
    throw new Error("No IT specialist found!");
  }
});
```

### Questions:
1. If the query `findFirst` throws the "No IT specialist found" error, will the onboarding case `case-01` be successfully rolled back? Why or why not?
2. Explain how this relates to connection pool leaks.

### Self-Grading Guide:
* **To score a 3**: You must state that yes, the transaction rolls back because an error was thrown inside the transaction callback, causing all pending operations under `tx` to be aborted. However, you must highlight that the call to the root `prisma` client instead of `tx` runs outside the transaction boundary. This creates a parallel query execution, risking dirty reads and connection pool exhaustion.

---

## Exercise 2: Tracing an IDOR Attack (Concept: Security)

Open [backend/src/middleware/requirePermission.middleware.ts:19-59](backend/src/middleware/requirePermission.middleware.ts#L19-L59). Imagine a manager with `departmentId: "DEPT-SALES"` attempts to retrieve a case from `departmentId: "DEPT-IT"` using the case's ID.

Trace what the code **actually does** — not what it should do. Does anything stop this request? What JSON response will the manager receive?

### Self-Grading Guide:
* **To score a 3**: You must discover that:
  1. The role gate passes: `requireRole` only checks that the manager's role is in the allowed list for the route — the `PermissionMatrix` has no row-level concept at all (and note the real matrix keys: there is no `VIEW_TASK`; the case-viewing key is `VIEW_ALL_CASES`).
  2. The service layer does **not** automatically scope by department: `OnboardingCaseService.getAll` applies `where.departmentId` only when the caller passes a filter ([onboardingCases.service.ts:44-53](../../backend/src/modules/onboardingCases/onboardingCases.service.ts)), and the by-ID lookup has no department condition. The cross-department read succeeds today — this is a genuine IDOR gap, which is why Exercise 3 exists.
  3. The fix you build in Exercise 3 should return `404 Not Found` rather than `403 Forbidden` on a department mismatch, so an attacker cannot use the status code to confirm that a resource exists in another department.

---

## Exercise 3: Designing a Permission Gate (Concept: RBAC)

Write a custom Express route handler middleware `requireDepartmentAccess` that extracts a case ID from `req.params.id`, queries the database to find the case, and throws an `AppError` with a `403 Forbidden` status if the case's `departmentId` does not match the authenticated `req.user.departmentId`.

### Self-Grading Guide:
* **To score a 3**: Your middleware must:
  1. Extract `req.params.id` and check if `req.user` exists.
  2. Query `prisma.onboardingCase.findUnique` matching the ID.
  3. Validate if `case.departmentId === req.user.departmentId`.
  4. Throw a structured `AppError` on mismatch, or call `next()` on success.
