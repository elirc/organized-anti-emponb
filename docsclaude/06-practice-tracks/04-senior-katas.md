# System Design Challenges: Senior Katas

Mastery of system architecture involves predicting how code will fail under extreme scale, concurrency, and network distribution. These senior design katas present complex scenarios with specific engineering trade-offs for you to analyze.

---

## Senior Kata 1: Distributed Lock Mechanics
* **Scenario**: Under high concurrency (such as hundreds of automation scripts updating the same onboarding case simultaneously), multiple servers running in a cluster attempt to recalculate progress and update the database at the exact same millisecond. This leads to database lock contentions and progress mismatch errors.
* **Problem**: How do you prevent concurrent race conditions across multiple completely isolated server processes?
* **Design Assignment**: 
  1. Design a distributed locking mechanism using Redis (e.g. Redlock algorithm).
  2. Map the pseudo-code for a locker decorator that wraps database updates, ensuring only one process holds the lock key at a time.
  3. Detail how to handle lock expiration timeouts if a server crashes while holding the key.

---

## Senior Kata 2: Cache Invalidation Strategies
* **Scenario**: To speed up dashboard read operations under millions of active cases, we introduce a Redis cache layer that stores complete case models.
* **Problem**: The database is constantly being updated by background workers, managers, and integrations. How do you ensure cached snapshots never display stale data to users without overloading the Redis connection?
* **Design Assignment**:
  1. Compare the trade-offs of the following invalidation patterns:
     * **Time-to-Live (TTL)**: Dynamic caching with brief auto-expiry boundaries (e.g., 5 seconds).
     * **Write-Through**: Updating the cache key in the exact same transaction that writes to the database.
     * **Cache-Aside / Event-Driven**: Emitting an event (via BullMQ or Kafka) post-commit that async invalidates targeted keys.
  2. Create a cache key structural naming standard that supports fine-grained department-level invalidations.

---

## Senior Kata 3: Eventual Consistency and Queue Replays
* **Scenario**: Our platform relies on third-party APIs (like Workday HR or external background screening partners) to synchronize candidate records.
* **Problem**: Third-party APIs are highly volatile and experience frequent outages. How do you build a reliable integration that guarantees data delivery without blocking local user flows when external partners are offline?
* **Design Assignment**:
  1. Design an eventual consistency architecture using message queues.
  2. Implement an exponential backoff retry strategy with jitter (randomized sleep offsets) to prevent overwhelming recovered third-party endpoints.
  3. Draw a Mermaid sequence diagram tracing how sync jobs are enqueued, retried, and eventually routed to an administrator dashboard (Dead Letter Queue) on repeated failures.
