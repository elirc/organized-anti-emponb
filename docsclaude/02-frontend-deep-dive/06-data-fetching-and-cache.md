# Cache Synchronization and Refetching: Server Data Layers

When building data-heavy client platforms, managing server data involves two distinct challenges: fetching remote datasets efficiently and synchronizing client state after performing local updates.

---

## Server State vs. Local Client State

* **Local Client State**: Interactive states owned entirely by the browser (such as toggled filters or open slide-overs).
* **Server State**: Remote datasets stored in the database. The client does not own this data; it holds only a read-only cache snapshot that can become stale at any moment.

A common junior anti-pattern is copying server responses directly into global Zustand stores. This requires you to write complex code to manually synchronize updates across unrelated pages. Instead, we should decouple server data fetching from client state management.

---

## The Query Mutation Lifecycle

When the user performs an update (such as changing a task's status or uploading a document), we trigger an API mutation. Once the mutation succeeds, we must invalidate the client cache to force a refetch and display the updated data.

Inspect this cache synchronization sequence in our case details workspace:
[frontend/src/pages/CaseDetails.tsx:60-69](frontend/src/pages/CaseDetails.tsx#L60-L69):

```typescript
  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.patch(`/onboarding-tasks/${taskId}`, { status: newStatus });
      fetchCaseDetails(); // Force-refresh case data snapshot!
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update task status');
    }
  };
```

### Why This Synchronization Pattern works:
1. **Zero-Drift Refresh**: By calling `fetchCaseDetails()` immediately after the mutation completes, the client pulls the newly calculated case progress percentages directly from the database transaction.
2. **Simplified Coordination**: You do not have to write custom client-side math to recalculate the case's progress percent or track side effects manually. The server remains the single source of truth.

> **Senior aside:** *Always trigger data synchronization immediately after mutations complete. Relying on stale client-side caches or trying to calculate complex states on the client inevitably leads to data mismatch errors.*

---

## Pitfall Checklist

1. **Stale Data Caching**: Failing to refetch datasets after performing mutations, leaving the UI showing outdated records.
2. **Duplicate Query Invalidation**: Triggering redundant API requests by invalidating active queries multiple times.
3. **No Loading Indicators**: Failing to display skeleton screens or spinner states while async data queries are executing.
4. **Incorrect Query Key Arrays**: Using mismatched query keys inside fetch hooks, preventing correct cache updates.
5. **Caching Private Data Globally**: Storing tenant-specific queries in a shared, un-invalidated cache space.
6. **No Error Recovery**: Failing to handle network connection drops, leaving components hanging without retry logic.
7. **Polling Too Frequently**: Enqueuing automatic refetches at high frequencies, overloading database operations.
8. **Mismatched Server Formats**: Assuming date parameters returned from server caches conform to local timezone objects.

---

## Drills

1. **Synchronization Audit**: Open [frontend/src/pages/CaseDetails.tsx](frontend/src/pages/CaseDetails.tsx). Inspect how `handleTaskReassignment` and `handleDocumentReview` are configured. Confirm that they both trigger `fetchCaseDetails()` on success.
2. **Cache Key Extension**: Explain how you would refetch the global cases list dashboard when a single case's status changes inside the details view.
3. **Network Profiler Check**: Open the browser's Network tab. Perform three task updates in rapid succession and analyze the sequence and timing of outbound Axios request calls.
