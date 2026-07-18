# Metrics, Profiles, and Bundles: Performance Thinking

Performance is a key feature. An application that takes seconds to load or respond to clicks will frustrate users and increase server operation costs. 

A junior engineer who does not understand database query execution plans, bundle limits, or React rendering bottlenecks will inevitably deploy slow code.

---

## The Three Performance Domains

1. **Bundle Size (Frontend Load Time)**: The initial JavaScript asset payload compiled by Vite. Large packages delay page paint times.
2. **Render Optimization (Frontend Runtime)**: React component reconciliation execution times. Unnecessary re-renders cause interface lag and sluggish scroll events.
3. **Database Execution (Backend Runtime)**: DB query plan execution. Slow SQL queries consume database connection pools, leading to server timeouts.

---

## Database Aggregation Optimization

A common junior anti-pattern is fetching thousands of raw database rows into memory and using Javascript array iteration methods (like `filter` or `reduce`) to compute count statistics. This exhausts Node's memory heap and creates massive CPU bottlenecks.

Inspect how our reporting module aggregates case status statistics:
[backend/src/modules/reports/reports.service.ts:7-14](backend/src/modules/reports/reports.service.ts#L7-L14):

```typescript
    const statusCounts = await prisma.onboardingCase.groupBy({
      by: ['status'],
      _count: { id: true },
    });
```

### Why This Query Design is highly performant:
1. **Delegation to the Database Engine**: The `groupBy` operation compiles into a native, single SQL statement:
   ```sql
   SELECT status, COUNT(id) FROM "OnboardingCase" GROUP BY status;
   ```
2. **Sub-Millisecond Execution**: SQLite can scan and aggregate millions of rows in milliseconds using indexes. The database returns a tiny aggregated array containing only the status and count numbers.
3. **Minimal Memory Footprint**: Node's memory heap receives a clean, lightweight array rather than instantiating thousands of complete Prisma model object instances.

> **Senior aside:** *Always compute statistics, aggregates, and limits directly inside the database engine using group, select, and count queries. The database is heavily optimized for set operations; Node is not.*

---

## Pitfall Checklist

1. **In-Memory Aggregations**: Querying large datasets into memory to compute basic stats, exhausting heap pools.
2. **N+1 Database Query loops**: Iterating over collections and executing separate SQL lookups within loops.
3. **Missing DB Indexes on Foreign Keys**: Declaring relations in database schemas without matching index keys, causing full table scans.
4. **Large Initial Browser Bundles**: Importing heavy third-party libraries instead of lightweight packages.
5. **Inline Hook Dependencies**: Declaring dynamic inline arrays or object structures as React hook dependencies, causing infinite re-render cycles.
6. **No Request Pagination**: Returning entire datasets in API lists instead of enforcing limit/offset bounds.
7. **Ignoring Query Execution Plans**: Deploying heavy queries without analyzing execution patterns with `EXPLAIN`.
8. **Blocking Event Loop with Sync Operations**: Executing synchronous JSON parsing on heavy inputs on the main server thread.

---

## Drills

1. **Query Analysis Drill**: Open [backend/src/modules/reports/reports.service.ts:7-32](backend/src/modules/reports/reports.service.ts#L7-L32) and trace how the department and task bottleneck aggregations are configured.
2. **Render Count Audit**: Add a custom console time marker `console.time('render-run')` inside a component. Measure the render duration during search filtering operations.
3. **Index Evaluation**: Open `backend/prisma/schema.prisma` and verify that all tables used in relational query JOIN filters are protected by index keys.
