# Memory, Scopes, and Closures: The JavaScript Mental Model

Before writing application logic, you must predict JavaScript code execution without running it. A shaky mental model of memory references, lexical scoping, and closures leads to subtle bugs that compile cleanly but fail under production loads.

---

## Reference vs. Value Semantics

JavaScript distinguishes primitive types (String, Number, Boolean, BigInt, Symbol, null, undefined) from complex Objects (Object, Array, Function).

* **Primitives** are stored by **value**. Assigning or passing a primitive copy allocates a separate slot on the execution stack.
* **Objects** are stored by **reference**. Variables do not hold the object's properties; they hold a memory reference address pointing to the object on the heap. Assigning or passing an object copies only this reference address.

Here is illustrative code to show how primitive stack copies differ from object heap references:

```ts
// Illustrative — not from the repo
let countA = 10;
let countB = countA; // Primitive copy of value 10
countB = 20; // countA remains 10

let recordA = { title: "Onboard IT Equipment" };
let recordB = recordA; // Reference pointer copied
recordB.title = "Onboard Payroll Setup"; // Mutates shared heap object!
// Both recordA.title and recordB.title are now "Onboard Payroll Setup"
```

> **Senior aside:** *Never mutate shared objects directly. Mutations lead to unpredictable side effects where remote UI components or services update because they share a heap reference address. Treat inputs as read-only by default.*

---

## Lexical Scopes and Closures

JavaScript resolves identifiers by looking up the nested lexical scopes in which they were written.

A **closure** is the combination of a function bundled together with references to its surrounding state (the lexical environment). Closures allow an inner function to access variables from an outer function's scope even after the outer function has completed execution.

In our production codebase, closures are extensively leveraged during database transactions. For example, inspect the transaction callback at:
[backend/src/modules/onboardingCases/onboardingCases.service.ts:236-239](backend/src/modules/onboardingCases/onboardingCases.service.ts#L236-L239):

```typescript
  static async startOnboardingCase(caseId: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
```

In this real method, the transaction callback forms an asynchronous closure. The outer parameters `caseId` and `actorId` are defined in the parent execution block. When Prisma executes this transaction at some point on the call stack, the inner arrow function accesses the outer `caseId` and `actorId` values flawlessly because the closure preserves the lexical environment of the parent scope.

Without closures, you would have to pass every parameter explicitly into callbacks, rendering transaction pipelines cluttered and error-prone.

---

## Pitfall Checklist

1. **Object Mutation in Zustand Stores**: Mutating an object inside state stores directly instead of returning a new state reference block defeats shallow equality checks, causing the UI to fail to re-render.
2. **Accidental Closure Memory Leaks**: Holding references to large outer scope objects inside long-lived event listeners or timeouts prevents garbage collection.
3. **Array Mutation Pitfalls**: Using `Array.prototype.reverse()`, `sort()`, or `splice()` mutates the array in place, altering references shared by other modules.
4. **Shadowing Outer Scope Parameters**: Declaring an inner variable with the same name as an outer variable overrides access, leading to reference resolution errors.
5. **JSON Parsing Shallow Duplication**: `JSON.parse(JSON.stringify(x))` creates a deep clone but strips out functions, dates, and undefined values.
6. **Assigning Function Handlers in Loops**: Creating callbacks inside loops without scoping variables with `let`/`const` creates a closure over a shared loop iterator reference.
7. **Passing Object Refs as Hook Dependencies**: React hooks check dependency arrays via shallow comparisons. Passing a fresh inline object `{}` triggers infinite execution loops.
8. **Loose Equality Coercion (`==`)**: Loose equality coerces values unpredictably. `null == undefined` is true, but `false == ""` is also true. Always enforce strict triple equals (`===`).

---

## Drills

1. **Closure Audit**: Open [backend/src/modules/onboardingCases/onboardingCases.service.ts:236-335](backend/src/modules/onboardingCases/onboardingCases.service.ts#L236-L335) and write down every identifier accessed inside the transaction block that was declared in the outer lexical scope.
2. **Heap Trace**: Write a short test script in the scratch folder that initializes a nested object, passes it through a function that mutates a deep key, and logs the original object to demonstrate reference leaks.
3. **Reference Safeguards**: Refactor an array manipulation using `map()` or the spread operator to prove that original references are left un-mutated.
