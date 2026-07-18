# Runtime Integrity and Compilation Safety: Type Essentials

In a statically typed codebase, the type system establishes a logical contract that the compiler verifies. However, TypeScript types are completely erased at runtime.

To maintain system integrity, we must bridges this gap by combining compile-time safety checks with runtime validation layers.

---

## Structural vs. Nominal Typing

* **Nominal Typing** (used in Java/C++): Type compatibility is determined by explicit class declarations. A class named `User` is not compatible with a class named `Client`, even if they have identical fields.
* **Structural Typing** (used in TypeScript): Compatibility is determined by the shape of the data. If an object has the required keys and types, the compiler accepts it, regardless of its original class or declaration source.

Here is illustrative code to show TypeScript's structural typing:

```ts
// Illustrative — not from the repo
interface Point2D {
  x: number;
  y: number;
}

function logCoordinates(point: Point2D) {
  console.log(`Coordinates: ${point.x}, ${point.y}`);
}

const entity = { x: 10, y: 20, z: 30 };
logCoordinates(entity); // Allowed! The entity structurally satisfies Point2D.
```

---

## Runtime Type Enforcement with Zod

Because TypeScript types do not exist at runtime, incoming HTTP requests can contain any arbitrary data structure. We resolve this by compiling TypeScript types dynamically from runtime schemas.

Inspect this pattern in our schemas module:
[backend/src/modules/onboardingCases/onboardingCases.schemas.ts:6-14](backend/src/modules/onboardingCases/onboardingCases.schemas.ts#L6-L14):

```typescript
export const createOnboardingCaseSchema = z.object({
  employeeProfileId: z.string().uuid('Invalid employee profile ID'),
  departmentId: z.string().uuid('Invalid department ID'),
  workflowTemplateId: z.string().uuid('Invalid workflow template ID'),
  startDate: z.string().datetime('Invalid start date format'),
});

export type CreateOnboardingCaseInput = z.infer<typeof createOnboardingCaseSchema>;
```

### Why This Matters:
1. **Dynamic Generation**: `z.infer` dynamically derives a TypeScript static type from the `createOnboardingCaseSchema` object. You write the schema exactly once; the compiler extracts the interface type automatically.
2. **Zero-Drift Contracts**: If a developer changes the `departmentId` constraint, both runtime validation checks and build-time static parameters are synchronized instantly.

> **Senior aside:** *Never bypass validation schemas. Trusting client payloads without runtime validation causes SQL database constraints to fail, resulting in 500 error leakages.*

---

## Discriminated Unions and Control Flow Narrowing

A **Discriminated Union** is a type design pattern where multiple distinct object types share a common, literal value property (the "discriminant"). You can narrow the Union's scope using conditional checks, allowing the compiler to verify precise fields on specific variations.

Our case state transitions utilize status strings that act as boundaries. When we match statuses, TypeScript narrows parameters, protecting our operations logic.

---

## Pitfall Checklist

1. **Blind Type Assertions (`as AnyType`)**: Overriding the compiler by forcing a type with `as`. This silences build errors but leaves runtime type mismatches unchecked.
2. **Excessive `any` Types**: Using `any` disables all compiler safeguards. Always prefer `unknown` if a type is genuinely undetermined.
3. **Zod and TS Contract Drift**: Declaring a TypeScript interface manually alongside a Zod schema instead of using `z.infer`. This leads to configuration drift.
4. **Incorrect Optional Declarations**: Declaring a field as optional `?` when the runtime requires a database null value.
5. **No Discriminant Check Narrowing**: Trying to access a variant's property without narrowing the union, triggering compilation faults.
6. **Implicit Any Types**: Failing to declare variable types or function return scopes, allowing implicit `any` assignments to bypass checks.
7. **Ignoring TS Compiler Null Checks**: Disabling `strictNullChecks` in compiler flags, leading to "Cannot read property of undefined" crashes.
8. **Invalid Date Format Coercions**: Accepting date inputs as strings without using validation libraries to sanitize ISO strings.

---

## Drills

1. **Schema Validation Mapping**: Inspect [backend/src/modules/onboardingCases/onboardingCases.schemas.ts:6-14](backend/src/modules/onboardingCases/onboardingCases.schemas.ts#L6-L14) and write a custom schema that adds a `note` property representing a string of maximum 200 characters.
2. **Type Extraction Check**: Use `z.infer` to extract a TypeScript type from your newly created schema. Write a mock function that uses this type as an argument.
3. **Structural Assignment Verification**: Write a scratch script with a strict function argument, and try passing an object with extra keys to verify structural subtyping in practice.
