# Dependency Isolation and Workspace Mappings: Monorepo Tooling

In modern enterprise architectures, workspaces are organized as monorepos to share types, dependencies, and configuration boundaries. A junior engineer who does not understand monorepo dependency scopes will inevitably pollute configurations, trigger circular dependency lockups, or introduce code compilation failures.

---

## Monorepo Workspace Mappings

Our repository is organized as an npm monorepo using workspaces. The root orchestration config is specified in:
[package.json:5-8](package.json#L5-L8):

```json
  "workspaces": [
    "backend",
    "frontend"
  ],
```

NPM workspaces allow both `backend` and `frontend` packages to reside in their respective folders while sharing a central `node_modules` cache folder at the root level. When you run `npm install` at the root, npm automatically resolves the dependencies of both workspaces, builds a unified dependency tree, and sets up local symlinks to cross-referenced local packages.

---

## CommonJS vs. ES Modules (ESM)

The JavaScript ecosystem utilizes two primary module resolution systems:
* **CommonJS (CJS)**: Uses synchronous `require()` and `module.exports`. Common in legacy Node.js environments.
* **ES Modules (ESM)**: Uses static, asynchronous `import` and `export` statements. Designed for modern web applications and static analysis.

Our `backend` compiler translates TypeScript files into Node-compatible commonJS syntax, while the `frontend` uses Vite to compile modern ESM client bundles.

### The Circular Dependency Trap

Circular dependencies occur when Module A imports Module B, and Module B imports Module A. Because CommonJS executes files synchronously as they are imported, a circular loop can lead to incomplete module exports, returning `undefined` or throwing runtime errors.

In our production codebase, we systematically avoid circular dependency crashes using **asynchronous dynamic imports**. Look at this real-world implementation inside:
[backend/src/modules/onboardingTasks/onboardingTasks.service.ts:168-171](backend/src/modules/onboardingTasks/onboardingTasks.service.ts#L168-L171):

```typescript
          // Enqueue background email notifications to managers/approvers (enqueued post-transaction in service)
          try {
            const { NotificationService } = await import('../notifications/notification.service');
```

By dynamically importing `NotificationService` *only* inside the execution block of `OnboardingTasksService.update`, we prevent circular dependency loops at boot time! The compiler successfully initializes both services because `NotificationService` is resolved lazily at runtime rather than statically at file load.

> **Senior aside:** *Always use dynamic `import()` statement paths sparingly. While they bypass static circular dependencies, excessive reliance on lazy loading obscures dependency graphs, making it harder to refactor architectural boundaries.*

---

## TSConfig Compiler Invariants

To keep types consistent, our compilation layers are configured in their respective tsconfig files.
* **Root TSConfig**: Configures global path mappings and compiler targets.
* **Backend TSConfig**: Translates to CommonJS target environments for compatibility.
* **Frontend TSConfig**: Targets modern ES2020 modules, allowing Vite to optimize asset compilation.

---

## Pitfall Checklist

1. **Circular Import Loops**: Statically importing services that import each other, resulting in crashes or `undefined` imports.
2. **Missing Workspace Mappings**: Creating sub-packages without registering their paths inside the root `package.json` workspaces array.
3. **Phantoms Dependencies**: Importing a package in a subfolder that is declared only in the root `package.json` rather than the subfolder's `package.json`.
4. **Mismatched TypeScript Targets**: Compiling the backend with standard ES Modules without ensuring the server runtime fully supports modern ESM imports.
5. **Importing DevDependencies in App Build Code**: Importing a development package (such as testing utilities or code formatters) into application-critical paths.
6. **Direct Import of TS Files Across Workspaces**: Importing raw `.ts` files from another workspace without compiling or mapping them through package entries.
7. **Absolute vs. Relative Import Path Conflicts**: Using absolute paths that fail to resolve when compiled or bundled in local development.
8. **Dev Server Cache Invalidation Failure**: Editing shared workspaces files without triggering local Hot Module Replacement (HMR).

---

## Drills

1. **Dynamic Import Trace**: Open [backend/src/modules/onboardingTasks/onboardingTasks.service.ts:168-171](backend/src/modules/onboardingTasks/onboardingTasks.service.ts#L168-L171). Identify why importing `NotificationService` statically at the top of the file would trigger a circular dependency loop with `onboardingTasks.service.ts`.
2. **Monorepo Mapping Audit**: Review [package.json:5-8](package.json#L5-L8). Add a dummy folder `shared-types` at the monorepo root, write a basic `.json` manifest, and add it to the workspaces array to verify workspace registration logic.
3. **Build Target Check**: Open `frontend/tsconfig.json` and `backend/tsconfig.json`. Identify the difference between the `module` and `target` properties and explain how this impacts code compiled for the browser versus the server.
