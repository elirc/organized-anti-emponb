# Advanced Compiler Enforcement: Type System Power Tools

When building complex multi-role platforms, standard TypeScript types are sometimes insufficient. Advanced utilities like conditional types, mapped types, and branded types allow you to encode sophisticated business rules directly into the compiler, preventing domain corruption.

---

## Branded Types: Preventing Domain Mismatches

A common bug in large systems is passing one identifier to a function that expects another. Because both IDs are represented as strings, the compiler allows it:

```ts
// Illustrative — not from the repo
function deactivateUser(userId: string) { ... }
const caseId = "case-uuid-123";
deactivateUser(caseId); // Compiles! But crashes at runtime!
```

To prevent this type of error, we can use **Branded Types**. Branded types use intersection types to attach an invisible metadata "brand" label to basic types (like strings), making them incompatible structurally.

Here is illustrative code to show how branded types enforce identifier safety:

```ts
// Illustrative — not from the repo
type Brand<T, K extends string> = T & { __brand: K };

type UserId = Brand<string, "UserId">;
type CaseId = Brand<string, "CaseId">;

function deactivateUser(userId: UserId) { ... }

const myUserId = "user-123" as UserId;
const myCaseId = "case-123" as CaseId;

deactivateUser(myUserId); // Compiles perfectly!
deactivateUser(myCaseId); // Compiler Error: Type 'CaseId' is not assignable to 'UserId'!
```

---

## Mapped and Conditional Types

* **Mapped Types**: Allow you to transform an existing type structure key-by-key.
* **Conditional Types**: Express non-trivial type assignments based on generic checks (`T extends U ? X : Y`).

In our front-end store, we manage state hooks using dynamic getters. Let's look at the authorization state definition at:
[frontend/src/stores/authStore.ts:24-32](frontend/src/stores/authStore.ts#L24-L32):

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
```

If we wanted to dynamically extract all read-only properties from `AuthState` while stripping out functions, we could design a conditional mapped type:

```ts
// Illustrative — not from the repo
type NonFunctionProperties<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

type ReadOnlyState = NonFunctionProperties<AuthState>;
// Resulting type contains only: user, accessToken, and isAuthenticated!
```

> **Senior aside:** *Use advanced type magic only when necessary. If a junior developer cannot read or refactor a type utility because it is too complex, it becomes a maintenance bottleneck rather than an asset.*

---

## Pitfall Checklist

1. **Over-Typing Simple Code**: Using complex generic wrappers for simple data models, making the code hard to read.
2. **Abusing `as unknown as T`**: Forcing type compliance by double-casting variables to bypass compiler checks.
3. **Infinite Type Recursion**: Writing recursive conditional types that lock up the compiler.
4. **Failing to Constrain Generics**: Declaring `function log<T>(x: T)` instead of restricting parameters with `extends`.
5. **Branding Type Loss in Serialization**: Sending branded types across JSON borders. Deserialized payloads lose their brand labels, requiring manual re-casting.
6. **Unnecessary Template Literal Typings**: Creating complex type unions for simple layout configurations.
7. **Ignoring `satisfies` Benefits**: Using type assertions instead of the `satisfies` operator, which preserves narrow type references.
8. **Mismatched Return Types in Mapped Types**: Transforming key structures but returning incorrect types, leading to downstream type errors.

---

## Drills

1. **Branded Type Creation**: Create a branded type `EmailAddress` inside a test file. Write a function that accepts only `EmailAddress` and verify that the compiler rejects generic strings.
2. **Mapped Type Definition**: Write a mapped type `ReadonlyDeep<T>` that recursively marks all properties of a generic object as `readonly`. Test it against a mock interface.
3. **Satisfies Verification**: Declare a style configuration object using the `satisfies` operator to confirm it conforms to a key structure while preserving literal values.
