# Module 02: Frontend Client Deep Dive

This module examines the visual layer of our enterprise onboarding platform. We utilize React 18, Vite, Zustand for global state caching, Axios for rolling token validation intercepts, and Tailwind CSS for responsive layouts.

---

## Contents Covered in This Module

1. **[01-how-it-renders.md](01-how-it-renders.md)**: The React 18 reconciliation model, the render vs. commit phases, and re-rendering behaviors.
2. **[02-state-primitives.md](02-state-primitives.md)**: Local hook primitives including `useState`, `useMemo`, `useCallback`, and hook dependencies.
3. **[03-state-architecture.md](03-state-architecture.md)**: State orchestration, context, and state management using Zustand.
4. **[04-forms-and-validation.md](04-forms-and-validation.md)**: Form management, controlled state components, and schema integrations.
5. **[05-server-vs-client.md](05-server-vs-client.md)**: Architectural boundaries, network request wrappers, and JWT refreshing.
6. **[06-data-fetching-and-cache.md](06-data-fetching-and-cache.md)**: TanStack Query data synchronization, mutation lifecycle, cache queries, and updates.

---

## Learning Objectives

* Explain how the virtual DOM reconciliation process operates and why key assignments protect components from full structural rebuilds.
* Design robust Zustand caches that optimize network communication and avoid redundant API fetches.
* Configure Axios rolling JWT token interceptors to support silent sessions updates without disrupting user flows.
* Build fully validated form structures integrated with server-side error schemas.
