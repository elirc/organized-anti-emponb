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

Open [backend/src/shared/middleware/requirePermission.middleware.ts:31-38](backend/src/shared/middleware/requirePermission.middleware.ts#L31-L38). Imagine a manager with `departmentId: "DEPT-SALES"` attempts to retrieve a task from `departmentId: "DEPT-IT"` using the task's UUID.

Explain how our permissions-based middleware and department checks prevent this. What JSON response will the manager receive?

### Self-Grading Guide:
* **To score a 3**: You must explain that:
  1. The manager holds the `VIEW_TASK` permission, so the permission check passes.
  2. However, the subsequent service layer query filters results by `departmentId: user.departmentId` (or verifies matches before returning).
  3. If there is a mismatch, the database returns `null`, and the server returns a `404 Not Found` response instead of a `403 Forbidden` response. This prevents attackers from even confirming the existence of resources belonging to other departments.

---

## Exercise 3: Designing a Permission Gate (Concept: RBAC)

Write a custom Express route handler middleware `requireDepartmentAccess` that extracts a case ID from `req.params.id`, queries the database to find the case, and throws an `AppError` with a `403 Forbidden` status if the case's `departmentId` does not match the authenticated `req.user.departmentId`.

### Self-Grading Guide:
* **To score a 3**: Your middleware must:
  1. Extract `req.params.id` and check if `req.user` exists.
  2. Query `prisma.onboardingCase.findUnique` matching the ID.
  3. Validate if `case.departmentId === req.user.departmentId`.
  4. Throw a structured `AppError` on mismatch, or call `next()` on success.
