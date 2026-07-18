# Module 05 Practice Drills: Quality & Security Systems

Analyze each drill, write down your prediction or code refactoring strategy, execute the code, and evaluate your understanding using the self-grading rubric.

---

## Self-Grading Rubric
* **0 - No Attempt**: No code written or predictions made.
* **1 - Minor Gaps**: Attempted the task but missed key security rules, database indexes, or testing assertions.
* **2 - Correct with Reference Help**: Successfully completed the challenge, but had to reference module files or configurations.
* **3 - Complete Mastery**: Solved the challenge quickly and can explain mock transactions, query optimizations, and OWASP defenses flawlessly.

---

## Exercise 1: Formulating a Mock Unit Test (Concept: Testing)

Open [backend/src/modules/onboardingCases/__tests__/onboardingProgress.service.test.ts](backend/src/modules/onboardingCases/__tests__/onboardingProgress.service.test.ts). 

Write a new test case that verifies the progress calculator returns exactly `0` percent when a case has no associated tasks. Make sure to mock `findMany` to return an empty array `[]`.

### Self-Grading Guide:
* **To score a 3**: Your test case must:
  1. Use Vitest's `it` function with a descriptive name.
  2. Mock the `findMany` database lookup to return `[]`.
  3. Invoke `recalculateOnboardingProgress` with your mock transaction client.
  4. Assert the result is exactly `0` using `expect().toBe(0)`.

---

## Exercise 2: Optimizing an Aggregation Query (Concept: Performance)

Analyze this proposed code to count complete checklist tasks for reporting:

```ts
// Illustrative — not from the repo (Poor Performance!)
const tasks = await prisma.onboardingTask.findMany();
const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
```

Write an optimized version using Prisma's `count` aggregation API. Explain why your refactored query runs faster and consumes less memory.

### Self-Grading Guide:
* **To score a 3**: Your optimized query must use:
  ```ts
  const completedCount = await prisma.onboardingTask.count({
    where: { status: 'COMPLETED' }
  });
  ```
  You must explain that:
  1. The filter is executed inside the SQLite database using index keys rather than loading all records into Node's memory heap.
  2. Only a single integer is returned across the network, reducing bandwidth and CPU cycles.

---

## Exercise 3: Security Review of a URL Handler (Concept: Security)

Trace this Express handler:

```ts
// Illustrative — not from the repo
router.get("/reports/download", async (req, res) => {
  const { path } = req.query;
  // VULNERABLE: Direct local file reading!
  res.sendFile(path as string);
});
```

Identify the vulnerability (OWASP category) in this route and write a proposed refactoring plan to secure it.

### Self-Grading Guide:
* **To score a 3**: You must identify this as **Path Traversal / Local File Inclusion (SSRF/Access Control Failure)**. Attackers can pass `path=../../../../etc/passwd` or system files to download sensitive server secrets. 
  Your refactoring plan must:
  1. Restrict downloads to a specific directory using path containment validation.
  2. Sanitize query inputs using a Zod schema.
  3. Validate permissions before serving files.
