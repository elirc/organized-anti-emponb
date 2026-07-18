# Hooks, Memoization, and Dependencies: Local State Primitives

State is the source of truth that drives interactive interfaces. A failure to select the right state primitives, manage dependency arrays, or clean up side effects results in state synchronization drift and memory leaks.

---

## State Primitives and Memory Caching

React provides several local state hooks:
* **`useState`**: Triggers a re-render when the state value is updated.
* **`useMemo`**: Caches the result of an expensive calculation, recalculating it only when dependencies change.
* **`useCallback`**: Caches the function reference itself, preventing unnecessary children updates.
* **`useEffect`**: Coordinates side effects outside React's render scope (network subscriptions, event hooks).

---

## Deriving State vs. Redundant State Syncs

A common junior anti-pattern is storing derived data inside a separate `useState` hook and keeping it synchronized using `useEffect`. This leads to redundant rendering passes and code complexity.

Look at how our cases list handles search filtering:
[frontend/src/pages/CasesList.tsx:55-58](frontend/src/pages/CasesList.tsx#L55-L58):

```typescript
  const filteredCases = cases.filter((c) => {
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    const matchesDept = deptFilter ? c.departmentId === deptFilter : true;
```

### Why This is a Senior Design Pattern:
1. **Zero Redundant State**: `filteredCases` is computed on the fly during the render pass. There is no separate `useState` or `useEffect` hook to keep in sync.
2. **Instant Coordination**: When the user types into search inputs or changes status filters, the component re-renders, recalculating `filteredCases` instantly.
3. **Low Overhead**: Filtering lists of hundreds of elements is extremely cheap for the JavaScript execution thread. Storing it as a separate state would yield more overhead than recalculating it on each render pass.

> **Senior aside:** *Never use `useEffect` to synchronize local states. Derive values directly in the render block or memoize them using `useMemo` if the operation is computationally expensive.*

---

## Pitfall Checklist

1. **Redundant State Storage**: Storing derived values in `useState` and updating them inside `useEffect` blocks.
2. **Missing Hook Dependencies**: Omitting referenced variables from dependency arrays inside `useCallback`, `useMemo`, or `useEffect`, leading to stale closures.
3. **Empty Dependency Array Lies**: Passing an empty dependency array `[]` when the block references outer scope parameters.
4. **Infinite Callback Updates**: Creating a callback hook that updates state, which in turn invalidates the hook's own dependency references.
5. **Missing Effect Cleanup**: Failing to return a cleanup function (e.g., unsubscribing from event listeners or aborting active fetch operations) in `useEffect`.
6. **Overusing Memoization**: Wrapping simple functions in `useCallback` when the overhead of executing the hook is greater than recreating the function reference.
7. **Unnecessary State Initialization**: Storing static data in `useState` that never mutates. Use a simple constant declared outside the component instead.
8. **Stale Closure Bugs**: Accessing variables from a previous render pass due to incorrect dependency declarations inside closures.

---

## Drills

1. **Derived Data Exercise**: Identify every instance of derived data in [frontend/src/pages/CasesList.tsx](frontend/src/pages/CasesList.tsx) that does not use a dedicated `useState` hook.
2. **Stale Closure Test**: Write a component containing a counter and an event listener inside a `useEffect` with an empty dependency array. Observe if the event listener correctly captures updates to the counter state.
3. **Memoization Analysis**: Open a detail page. Identify if any complex objects are being created dynamically during render, and determine if they should be wrapped inside `useMemo`.
