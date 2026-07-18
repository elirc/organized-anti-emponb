# Derive vs. Store: State Materialization and Cache Syncs

When building high-performance platforms, managing calculated data presents a classic trade-off: do you compute values dynamically on every read request, or do you store the calculated result in a database column (materialization) and synchronize it when dependencies change?

---

## Compute on Demand vs. Materialized Columns

* **Compute on Demand**: Calculate the value (such as a progress percentage or aggregate SLA metric) dynamically inside the SELECT query. 
  * *Advantage*: Guaranteed to be 100% accurate; no synchronization code required.
  * *Disadvantage*: Slows down dashboard list queries, as the database must perform aggregation calculations across thousands of rows for every page load.
* **Materialized Cache**: Calculate the value on write operations and store it in a dedicated column.
  * *Advantage*: Reads are extremely fast, as the database simply reads a static integer value.
  * *Disadvantage*: Risk of synchronization drift if updates bypass the calculation hooks.

---

## The Progress Materialization Pattern

Our platform strikes the perfect balance: we compute progress percentages dynamically inside service transaction blocks and persist (materialize) the result to support high-performance dashboard lists.

Inspect this implementation:
[backend/src/modules/onboardingCases/onboardingProgress.service.ts:8-22](backend/src/modules/onboardingCases/onboardingProgress.service.ts#L8-L22):

```typescript
  static async recalculateOnboardingProgress(caseId: string, tx: any = prisma): Promise<number> {
    const tasks = await tx.onboardingTask.findMany({
      where: { onboardingCaseId: caseId }
    });

    const total = tasks.length;
    if (total === 0) {
      return 0;
    }

    const completed = tasks.filter(
      (task: any) => task.status === 'COMPLETED' || task.status === 'SKIPPED'
    ).length;

    const progress = Math.round((completed / total) * 100);
```

### Why We Materialize This Metric:
1. **Sortable Pipelines**: By storing the progress percentage in the `progressPercent` column, the cases dashboard can sort, filter, and page records instantly using indexed integer columns:
   [backend/src/modules/onboardingCases/onboardingCases.service.ts:65-68](backend/src/modules/onboardingCases/onboardingCases.service.ts#L65-L68):
   ```typescript
    return prisma.onboardingCase.findMany({
      where,
      orderBy: { startDate: 'asc' },
   ```
2. **Transaction Hook Syncs**: Every task status update, task reassignment, or approval decision triggers `recalculateOnboardingProgress` inside the same transaction block, ensuring that the materialized column never drifts out of sync.

> **Senior aside:** *Only materialize metrics when they are frequently read or sorted. Materializing values that are rarely read adds unnecessary write overhead and increases the risk of data drift.*

---

## Pitfall Checklist

1. **State Synchronization Drift**: Mutating child items without triggering the recalculation methods, leaving parent materialized columns stale.
2. **N+1 Calculations in Lists**: Computing aggregations dynamically inside list iteration loops instead of eager-loading or using materialized columns.
3. **Double Write Overheads**: Unnecessarily recalculating parent state values during minor updates that do not affect the metric.
4. **Incorrect Initializer States**: Initializing parent progress columns to `100` when a case has no active tasks.
5. **No Transaction Guards on Calculations**: Recalculating state values outside the transactional write block, allowing concurrent operations to overwrite updates.
6. **Polymorphic Field Assumptions**: Storing calculated data in flexible JSON columns, preventing standard database index optimization.
7. **Ignoring Out-of-Sync Indicators**: Failing to write database integrity check scripts to verify materialized columns match raw child states.
8. **Stale Cache Keys in Memory**: Failing to invalidate Redis cache keys when parent records are updated.

---

## Drills

1. **Recalculation Audit**: Open [backend/src/modules/onboardingCases/onboardingProgress.service.ts](backend/src/modules/onboardingCases/onboardingProgress.service.ts) and verify how the system handles the case's `completedAt` timestamp when progress reaches 100%.
2. **Materialization Extension**: Write a draft schema updates plan to materialize the number of overdue tasks on an onboarding case. Outline the triggers required to keep this column in sync.
3. **Database Integrity Check**: Write a Socratic CLI script in your scratch folder that queries all cases, computes their progress percent dynamically, and flags any records where the materialized column does not match the actual calculations.
