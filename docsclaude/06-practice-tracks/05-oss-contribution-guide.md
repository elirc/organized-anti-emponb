# Open Source Contribution and PR Guidelines

Professional codebases require collaboration standards. This guide establishes our open-source contribution guidelines, git branch naming schemes, code styling specs, and pull request review expectations.

---

## 1. Git Branch Naming Scheme

We use semantic prefix naming for all development branches:
* **`feat/feature-description`**: Spawning new system capabilities or tools.
* **`fix/bug-description`**: Fixing production bugs or test regressions.
* **`refactor/module-description`**: Improving existing structures without altering user features.
* **`docs/doc-updates`**: Modifying readmes, diagrams, or currical guides.

*Example*: `feat/task-sla-timer` or `fix/jwt-expiry-crash`.

---

## 2. Pull Request Blueprint

Every Pull Request must utilize the following structured template. It requires developers to declare their design choices, list database migration impacts, and document testing verifications.

```markdown
## 1. Technical Goal
Provide a brief, 2-3 sentence summary of what this PR accomplishes and why the change is requested.

## 2. Proposed Changes
Group files by component and summarize the modifications:
- `[MODIFY] backend/src/modules/onboardingTasks/onboardingTasks.service.ts`: Added re-assignment logs.
- `[NEW] backend/prisma/migrations/20260519000000_add_sla_column.sql`: Database schema updates.

## 3. Database Migration Impacts
Does this change alter database schemas? If yes:
- [ ] Schema migrations applied locally.
- [ ] No breaking columns removed (backward compatible).

## 4. Verification Plan
List the exact automated tests executed:
- [x] Run Vitest: `npm run test` (100% Green).
- [ ] Manual check: Uploaded candidate document and verified status matches in dashboard view.
```

---

## 3. Code Style and Formatting Specs

* **Linting Rules**: We enforce strict ESLint and Prettier configurations. Always run `npm run lint` and `npm run format` inside the root directory before committing code.
* **Strict Typing**: Never use `any` types inside code revisions. Always declare exact TypeScript contracts or use `unknown` if types are genuinely undetermined.
* **No Inline Magic Constants**: Declare all operational offsets or magic numbers as typed configurations at the top of module files.
