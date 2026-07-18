# Module 02 Practice Drills: React & Client State Primitives

Analyze each drill, write down your prediction or code refactoring strategy, execute the code, and evaluate your understanding using the self-grading rubric.

---

## Self-Grading Rubric
* **0 - No Attempt**: No code written or predictions made.
* **1 - Minor Gaps**: Wrote the code or predicted the outcome but missed key state-syncing rules or dependencies.
* **2 - Correct with Reference Help**: Solved the challenge successfully, but had to consult external docs or module files.
* **3 - Complete Mastery**: Solved the task quickly and can explain the exact render/commit phases or Axios interceptor rules.

---

## Exercise 1: Predict the Re-Render (Concept: Reconciliation)

Analyze this component script and predict how many times `ConsoleLayout` renders:

```tsx
// Illustrative — not from the repo
import React, { useState } from 'react';

function ChildComponent() {
  console.log("Child Rendered!");
  return <div>Static Node</div>;
}

export default function ParentComponent() {
  const [count, setCount] = useState(0);
  console.log("Parent Rendered!");

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <ChildComponent />
    </div>
  );
}
```

### Questions:
1. When you click the increment button, does `ChildComponent` re-render? Why or why not?
2. How would you prevent `ChildComponent` from rendering when `count` updates?

### Self-Grading Guide:
* **To score a 3**: You must state that yes, `ChildComponent` re-renders every time `ParentComponent` updates because Parent's state change triggers a full structural render pass. To prevent this, you can wrap the child in `React.memo` or pass it as a `children` prop.

---

## Exercise 2: State Synchronization (Concept: Derived State)

Open [frontend/src/pages/CasesList.tsx:55-70](frontend/src/pages/CasesList.tsx#L55-L70). Imagine a junior developer proposes refactoring this filtering logic to use a dedicated state hook instead:

```tsx
// Illustrative — not from the repo
const [filteredCases, setFilteredCases] = useState<Case[]>([]);

useEffect(() => {
  setFilteredCases(cases.filter(c => c.status === statusFilter));
}, [cases, statusFilter]);
```

List three distinct structural reasons why the junior's proposed approach is inferior to the codebase's existing derived calculation pattern.

### Self-Grading Guide:
* **To score a 3**: You must list the following three reasons:
  1. It triggers a redundant second render pass because `setFilteredCases` is called *after* the initial render completes.
  2. It introduces state synchronization drift risk if other state variables update but are omitted from the dependency array.
  3. It bloats component complexity with unnecessary hooks.

---

## Exercise 3: Dynamic Interceptor Verification (Concept: Axios Boundaries)

Open [frontend/src/utils/api.ts:40-49](frontend/src/utils/api.ts#L40-L49). Write a short explanation of what would happen if the `/auth/refresh` API request itself returns a `401 Unauthorized` status. Why does this not trigger an infinite loop?

### Self-Grading Guide:
* **To score a 3**: You must explain that the `401` returned by `/auth/refresh` is caught by the error handler, but since the original request's `_retry` flag is already set to `true`, the condition evaluates to false. This bypasses the retry block, prevents an infinite loop, clears the state, and redirects the user to the login screen.
