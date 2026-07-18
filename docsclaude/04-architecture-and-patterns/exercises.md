# Module 04 Practice Drills: Architectural Patterns

Analyze each drill, write down your prediction or code refactoring strategy, execute the code, and evaluate your understanding using the self-grading rubric.

---

## Self-Grading Rubric
* **0 - No Attempt**: No code written or predictions made.
* **1 - Minor Gaps**: Attempted the task but missed key layering boundaries or transaction constraints.
* **2 - Correct with Reference Help**: Successfully completed the challenge, but had to reference module files or schema configurations.
* **3 - Complete Mastery**: Solved the challenge quickly and can explain architectural patterns and invariants flawlessly.

---

## Exercise 1: Identifying Layer Violations (Concept: Layering)

Analyze this proposed controller method written by a developer:

```ts
// Illustrative — not from the repo
static async updateDepartmentName(req: Request, res: Response) {
  const { id } = req.params;
  const { name } = req.body;

  // DIRECT DATABASE QUERY INSIDE CONTROLLER!
  const updatedDept = await prisma.department.update({
    where: { id },
    data: { name }
  });

  res.json(updatedDept);
}
```

### Questions:
1. Identify the architectural layer violation in this snippet.
2. Outline the exact refactoring steps required to restore proper layering boundaries.

### Self-Grading Guide:
* **To score a 3**: You must state that this controller directly executes a database query using `prisma.department.update`. This violates proper layering boundaries. To resolve this, you must extract the database logic into a dedicated service method `DepartmentService.updateName(id, name)` and invoke that service from the controller instead.

---

## Exercise 2: Implementing a State Machine Transition (Concept: State Machines)

Open [backend/src/modules/onboardingCases/onboardingCase.stateMachine.ts](backend/src/modules/onboardingCases/onboardingCase.stateMachine.ts). 

Write a new state transition configuration that permits transitioning a case from `IN_PROGRESS` to a new status `ON_HOLD`, and from `ON_HOLD` back to `IN_PROGRESS` or `CANCELLED`.

### Self-Grading Guide:
* **To score a 3**: Your state machine lookup matrix `allowedCaseTransitions` must include:
  1. `ON_HOLD` registered as a valid `CaseStatus`.
  2. `IN_PROGRESS: [... 'ON_HOLD']`.
  3. `ON_HOLD: ['IN_PROGRESS', 'CANCELLED']`.

---

## Exercise 3: Transactional Audit Integration (Concept: Transactions)

Open [backend/src/modules/onboardingCases/onboardingCases.service.ts:236-335](backend/src/modules/onboardingCases/onboardingCases.service.ts#L236-L335). 

Write a mock interactive transaction block that creates a new task template and logs a matching activity event in the same transaction. Ensure both database calls utilize the scoped transaction client `tx` context.

### Self-Grading Guide:
* **To score a 3**: Your mock transaction block must use `prisma.$transaction(async (tx) => { ... })` and execute `tx.taskTemplate.create` and `tx.onboardingActivity.create` within the scoped interactive transaction callback using `tx` instead of the root `prisma` client.
