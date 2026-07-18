# The Senior Architect's Review: Codebase Critique

As a senior software engineer, you must evaluate codebases with complete honesty. Every system architecture is a collection of trade-offs. This document provides a critique of our onboarding platform, identifying technical debt and scaling bottlenecks.

---

## 1. The Single-Point-of-Failure Engine: SQLite in Enterprise Contexts
* **The Fragility**: SQLite is a serverless, single-file relational database. It does not run as a standalone network process; instead, it is a library loaded directly into our Express runtime thread.
* **The Scaling Limit**: While SQLite is extremely fast for read operations, it supports only a single concurrent writer due to its database-level write locking mechanism. Under high concurrent write traffic (such as multiple HR managers starting workflows simultaneously), requests will stall and throw `SQLITE_BUSY` transaction timeout errors.
* **The Production Fix**: For production deployments, migrate the database layer to PostgreSQL or CockroachDB to support robust transaction isolation levels and distributed clustering.

---

## 2. The Volatility Risk: Redis In-Memory Fallback
* **The Fragility**: Our background worker fail-safe is extremely convenient for local development:
  [backend/src/modules/notifications/notification.service.ts:31-38](backend/src/modules/notifications/notification.service.ts#L31-L38)
  If the Redis server is offline, we schedule email dispatches in-memory using `setTimeout`.
* **The Scaling Limit**: In-memory task schedules are highly volatile. If the Node server process crashes or restarts (due to out-of-memory errors or automatic autoscaling), all pending notifications are lost forever. There is zero durability or retry persistence.
* **The Production Fix**: Enforce strict queue connection checks in production, blocking server boot if Redis or RabbitMQ connection boundaries are offline.

---

## 3. Lack of Transaction Retry Mechanics
* **The Fragility**: Our onboarding case initialization transaction performs multiple sequential writes:
  [backend/src/modules/onboardingCases/onboardingCases.service.ts:236-239](backend/src/modules/onboardingCases/onboardingCases.service.ts#L236-L239)
* **The Scaling Limit**: Under high concurrency, databases occasionally abort transactions due to transient deadlocks or locking conflicts. Currently, we contain no automatic retry logic. If a query fails, the error escapes to the client, forcing the user to manually click the button again.
* **The Production Fix**: Wrap database transactions in an exponential backoff retry wrapper to handle transient database locks gracefully.

---

## 4. Stale Session JWT Expiration Risks
* **The Fragility**: Our security model relies on short-lived JWT access tokens and HTTPOnly cookies:
  [frontend/src/utils/api.ts:40-49](frontend/src/utils/api.ts#L40-L49)
* **The Scaling Limit**: Currently, there is no active token blacklisting database layer. If a user logs out, the frontend clears its local store, but the access token remains cryptographically valid until its expiration window passes. An attacker who intercepts the JWT can continue calling API routes successfully.
* **The Production Fix**: Implement a Redis-backed token blacklist store that records revoked token identifiers on logout and checks them in auth middleware.
