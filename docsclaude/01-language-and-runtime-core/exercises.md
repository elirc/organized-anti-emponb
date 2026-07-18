# Module 01 Practice Drills: Predict-Then-Run

Follow this workflow for each drill:
1. **Analyze the snippet**: Read the code line by line.
2. **Write down your prediction**: Predict the console output or the compile-time result.
3. **Execute the code**: Run the snippet in a node environment or paste it into your scratchpad.
4. **Compare and Grade**: Score your work using the self-grading rubric.

---

## Self-Grading Rubric
* **0 - No Attempt**: Did not attempt or copy-pasted without writing a prediction.
* **1 - Off on Key Details**: Predicted the general outcome but missed scope, timing, or references.
* **2 - Correct with Reference Help**: Got the right outcome but had to re-read module files during analysis.
* **3 - Flawless Mastery**: Correctly predicted the outcome and can explain the underlying mechanics.

---

## Exercise 1: Reference vs. Value Mutators (Concept: Memory Models)

Predict the output of the following script:

```ts
// Predict-then-run snippet
const caseA = {
  id: "case-01",
  assignedTo: { name: "Sarah" }
};

const caseB = { ...caseA };
caseB.id = "case-02";
caseB.assignedTo.name = "John";

console.log("caseA.id:", caseA.id);
console.log("caseA.assignedTo.name:", caseA.assignedTo.name);
```

### Self-Grading Guide:
* **To score a 3**: You must predict that `caseA.id` remains `"case-01"`, but `caseA.assignedTo.name` is mutated to `"John"` because the shallow spread operator copies only the first-level properties, leaving deep objects sharing the same heap reference.

---

## Exercise 2: The Microtask Race (Concept: Event Loop Concurrency)

Predict the output order of the following execution block:

```ts
// Predict-then-run snippet
console.log("1: Start");

setTimeout(() => {
  console.log("2: Timer Macrotask");
}, 0);

Promise.resolve().then(() => {
  console.log("3: Promise Microtask A");
}).then(() => {
  console.log("4: Promise Microtask B");
});

process.nextTick(() => {
  console.log("5: nextTick Priority");
});

console.log("6: End");
```

### Self-Grading Guide:
* **To score a 3**: You must output the sequence: `1, 6, 5, 3, 4, 2`. You must explain that synchronous runs first (1, 6), then `process.nextTick` preempts standard microtasks (5), then Promise microtasks are resolved (3, 4), and only then the macrotask is executed (2).

---

## Exercise 3: Dynamic Import Invariants (Concept: Tooling & ESM)

Inside [backend/src/modules/onboardingTasks/onboardingTasks.service.ts:168-171](backend/src/modules/onboardingTasks/onboardingTasks.service.ts#L168-L171), we dynamically import `NotificationService`. 

What happens to execution timing if you import `NotificationService` statically at the top of the file instead? How does this relate to Node.js circular imports?

### Self-Grading Guide:
* **To score a 3**: You must explain that a circular dependency crash occurs at startup because both modules import each other statically, resulting in one module receiving an uninitialized empty reference block.

---

## Exercise 4: Schema Inference (Concept: Structural Typings)

Design a Zod validation schema representing a candidate onboarding document. The schema must contain:
1. `documentId` (string, UUID format)
2. `fileSize` (number, maximum value 5,000,000 bytes)
3. `status` (enum of: PENDING, APPROVED, REJECTED)

Then, extract the TypeScript compile-time type from this schema using `z.infer`.

### Self-Grading Guide:
* **To score a 3**: Your Zod schema must use `z.string().uuid()`, `z.number().max(5000000)`, and `z.enum(['PENDING', 'APPROVED', 'REJECTED'])`, and output the derived type using `z.infer<typeof schema>`.
