# Store Selection and Render Controls: Zustand State Architecture

As an application grows, managing state solely within local components leads to prop-drilling hell and fragmented business logic. Selecting the right architectural home for each piece of state (local, lifted, URL, global, server) is a key senior skill.

---

## Global State Modeling with Zustand

Zustand is a lightweight, hook-based state management library that uses pure closure stores. Unlike React Context, Zustand bypasses the Context provider boundary completely, allowing components to subscribe to precise slices of global state and avoid unnecessary re-renders.

Let's inspect our authentication store:
[frontend/src/stores/authStore.ts:36-43](frontend/src/stores/authStore.ts#L36-L43):

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
```

### Why This Architecture Works:
1. **Direct Subscriptions**: Components can subscribe to the exact fields they need. If a component reads only `isAuthenticated`, it will not re-render when `accessToken` changes.
2. **Outside React Scope**: The store's set/get closures exist independently of React component life-cycles, allowing you to read state outside React components (such as inside Axios interceptors).
3. **Built-in Persistence**: Using the `persist` middleware automatically syncs the state object with standard localStorage, maintaining user sessions across page reloads.

---

## Using Precise Selectors to Limit Re-renders

A common junior mistake is importing the entire store object inside components:

```ts
// Illustrative — not from the repo
const state = useAuthStore(); // Bad! Component will re-render on ANY store changes!
```

To limit renders, you must utilize precise **Selector Functions** to pull only the required slice:

```typescript
// Illustrative — not from the repo
const user = useAuthStore((state) => state.user); // Good! Re-renders ONLY if user changes!
```

> **Senior aside:** *Always define custom hooks or precise selectors when reading from Zustand stores. This decouples components from the store's internal layout, allowing you to refactor store fields without modifying every UI file.*

---

## Pitfall Checklist

1. **Broad Store Subscriptions**: Importing the entire store without selectors, triggering renders on unrelated updates.
2. **Zustand State Mutation inside Component**: Mutating properties on the store state directly instead of invoking setter actions.
3. **Duplicate State Storage**: Storing backend server records inside global Zustand stores instead of using server caches (like TanStack Query).
4. **Incorrect Persistence Cleanup**: Leaving old keys in localStorage when resetting or logging out users.
5. **Context Provider Rebuilds**: Wrapping dynamic global state in standard React Context without memoizing values, causing full DOM sub-tree re-renders.
6. **Mismatched Store Synchronization**: Storing URL filter state in global stores instead of the browser query parameters.
7. **Action/State Coupling**: Writing bloated state selectors that mix actions and state parameters in a single hook.
8. **Missing Shallow Comparators**: Failing to pass the `shallow` comparator when selecting multiple primitive properties at once.

---

## Drills

1. **Selector Review**: Open [frontend/src/components/ConsoleLayout.tsx](frontend/src/components/ConsoleLayout.tsx) and inspect how the auth store is imported. Ensure all imports leverage precise selectors.
2. **Store Action Creation**: Extend [frontend/src/stores/authStore.ts](frontend/src/stores/authStore.ts) by adding a new action `updateUserEmail(email: string)` and verify it compiles cleanly.
3. **URL State Check**: Review the filter system on page list dashboards. Determine if storing the search string in a global store would prevent users from sharing links, and explain why URL state is a better choice.
