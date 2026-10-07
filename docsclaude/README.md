# Monorepo Operations Mastery: 8-Week Upskilling Curriculum

> Snapshot note: this repo is an organized snapshot of `elirc/antiemponb`. Its code and `docsclaude/` pages matched that repo (which also adds an `astraupskill/` course and `tests/*.mjs` files not present here), so the `docsclaude/` refinements made there are carried over here.

Welcome to the HRFlow Onboarding Platform Educational Lab. This curriculum is designed to systematically upskill junior developers into highly rigorous mid- and senior-level engineers using this TypeScript React and Node.js monorepo as a live development laboratory.

Rather than presenting passive summaries or abstract API specifications, this course requires active practice: reading, modifying, building, refactoring, and arguing about actual architectural constraints in this workspace.

---

## The Journey Arc: Week-by-Week Pacing

| Week | Focus Area | Description | Associated Modules |
| :--- | :--- | :--- | :--- |
| **Week 1** | Runtime & Type Foundation | Memory allocation, JS event loop, structural types, and monorepo tooling. | Module 01 |
| **Week 2** | Frontend Rendering | React Render/Commit cycles, Zustand state layers, and React Hook Form validation. | Module 02 |
| **Week 3** | Backend Foundations | HTTP Express execution pipelines, Prisma schemas, and SQLite indexes. | Module 03 |
| **Week 4** | Platform Security | Session auth guards, JWT rotation gates, and cross-tenant RBAC isolations. | Module 03 & 04 |
| **Week 5** | Architectural Integrity | State machine transition engines, transactional integrity, and audits. | Module 04 |
| **Week 6** | Quality Systems | Vitest test recipes, mock transactions, and systematic debugging methods. | Module 05 |
| **Week 7** | Practice Tracks | Real-world modify tickets (Easy to Expert) and comprehensive project builds. | Module 06 |
| **Week 8** | Career Mastery & Review | Engineering PR guidelines, RFC writing, and senior design case critiques. | Module 07 |

---

## Module Index

* **[Module 01: Language & Runtime Core](01-language-and-runtime-core/README.md)**: Deep dive into JavaScript/TypeScript closures, async promises, Zod schemas, and advanced tsconfig wiring.
* **[Module 02: Frontend Client Deep Dive](02-frontend-deep-dive/README.md)**: Master the React render loop, Zustand global stores, data fetching invalidation patterns, and controlled forms.
* **[Module 03: Server-Side Mastery](03-server-mastery/README.md)**: Discover HTTP middleware loops, transactional Prisma query builders, and robust multi-tenant token architectures.
* **[Module 04: Architecture & Design Invariants](04-architecture-and-patterns/README.md)**: Study onboarding transition state machines, derived progress calculations, and architectural structural catalogs.
* **[Module 05: Quality & Security Engineering](05-quality-engineering/README.md)**: Learn automated Vitest integration mockups, systematic debugging models, and OWASP security checklists.
* **[Module 06: Live Practice Tracks](06-practice-tracks/README.md)**: Face 10 reading katas, 10 modify tickets, 5 deep build projects, and Socratic code-critique checklists.
* **[Module 07: Career Skills & Review](07-career-skills/README.md)**: Study review ethics, RFC design blueprints, and behavioral interview questions mapped directly to this codebase.

---

## Educational Conventions

1. **Exact Code Citations**: Every code statement references an active, verifiable path and line range, formatted like:
   `[backend/src/modules/onboardingCases/onboardingCase.stateMachine.ts:29-31](backend/src/modules/onboardingCases/onboardingCase.stateMachine.ts#L29-L31)`
2. **Senior Aside Callouts**: Short observations reflecting real-world engineering trade-offs, common pitfalls, and maintainability rules.
3. **Illustrative vs Quoted Code**: Copied production snippets are marked with direct links; illustrative teaching examples are explicitly labeled.
4. **Drills**: Every concept ends with active, 5-30 minute drills requiring the developer to read, write, or refactor directly in the codebase.
