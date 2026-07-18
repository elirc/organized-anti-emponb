# Module 03: Server-Side Mastery

This module details the backend services layer of our enterprise onboarding platform. We construct a secure, transactional HTTP REST server in Node.js, Express, Prisma ORM, SQLite database, and BullMQ background tasks.

---

## Contents Covered in This Module

1. **[01-runtimes-explained.md](01-runtimes-explained.md)**: Node.js multi-process scaling, memory allocations, garbage collection, and clustering.
2. **[02-http-handlers.md](02-http-handlers.md)**: Express execution pipelines, global route orchestrations, Zod request body validation, and error boundaries.
3. **[03-databases-and-data-layer.md](03-databases-and-data-layer.md)**: Prisma schemas, SQLite transaction isolation levels, query optimizations, and indices.
4. **[04-rpc-or-api-internals.md](04-rpc-or-api-internals.md)**: REST endpoints, HTTP protocol semantics, and automated error translation mapping.
5. **[05-auth-and-multi-tenancy.md](05-auth-and-multi-tenancy.md)**: Role-Based Access Control (RBAC), multi-tenant department boundaries, JWT rotators, and IDOR prevention.

---

## Learning Objectives

* Map the full Express HTTP request execution pipeline from TCP sockets through middleware blocks to controllers.
* Configure strict database transaction barriers inside Prisma, protecting checklists from dirty read errors.
* Design multi-tenant security structures that filter database queries automatically based on department scopes.
* Analyze memory footprints and garbage collection runs to isolate resource leaks.
