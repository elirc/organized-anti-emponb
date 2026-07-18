# Module 01: Language and Runtime Core

This module establishes the core execution foundation for any developer entering our TypeScript monorepo workspace. Junior engineers frequently get tripped up not because they don't understand the application's business layers, but because they have a shaky mental model of the underlying runtime mechanics.

---

## Contents Covered in This Module

1. **[01-mental-model.md](01-mental-model.md)**: JavaScript's execution stack, reference vs. value semantics, lexical scoping, and closures.
2. **[02-concurrency-and-io.md](02-concurrency-and-io.md)**: The single-threaded Node.js event loop, microtask vs. macrotask queues, async/await runtime behavior, and race conditions.
3. **[03-modules-and-tooling.md](03-modules-and-tooling.md)**: Monorepo workspace orchestration, package mappings, TSConfig compiler settings, and build systems.
4. **[04-type-system-essentials.md](04-type-system-essentials.md)**: Structural vs. nominal types, discriminated unions, structural narrowing, and validation contracts using Zod.
5. **[05-type-system-power-tools.md](05-type-system-power-tools.md)**: Advanced TypeScript utilities including conditional types, mapped types, `infer` capture parameters, and branded runtime invariants.

---

## Learning Objectives

* Predict JavaScript code execution behavior without running it by reasoning about scopes and memory references.
* Explain the exact execution sequence of promises and nested microtasks within Node's event loop.
* Decode structural compiler errors in a monorepo setup.
* Implement runtime schema validations that mirror TypeScript contracts.
