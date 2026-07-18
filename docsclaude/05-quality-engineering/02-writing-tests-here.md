# Concrete Recipes and Mocking Blueprints: Writing Tests Here

To help you get started with automated testing in our workspace, this file provides copy-pasteable test templates and mock setup configurations designed specifically for our Vitest test stack.

---

## The Isolated Mocking Recipe

When testing service layer logic (such as progress calculations or status validations), you must isolate database interactions. Instead of spinning up a physical database, we pass a mocked database transaction client `tx` to the service method.

Inspect this real implementation inside our test suite:
[backend/src/modules/onboardingCases/__tests__/onboardingProgress.service.test.ts:22-35](backend/src/modules/onboardingCases/__tests__/onboardingProgress.service.test.ts#L22-L35):

```typescript
  it('should correctly calculate percentage completed and skipped tasks', async () => {
    const mockTasks = [
      { id: '1', status: 'COMPLETED' },
      { id: '2', status: 'SKIPPED' },
      { id: '3', status: 'TODO' },
      { id: '4', status: 'IN_PROGRESS' },
    ];

    const mockTx = {
      onboardingTask: {
        findMany: vi.fn().mockResolvedValue(mockTasks),
      },
      onboardingCase: {
        findUnique: vi.fn().mockResolvedValue({ status: 'IN_PROGRESS', completedAt: null }),
```

### Why This Mocking Pattern is highly efficient:
1. **No External DB Required**: You do not have to clear, seed, or migrate local database files before executing tests.
2. **Speed**: The test runs purely in-memory, completing in less than 5 milliseconds.
3. **Deterministic Control**: You can control exactly what records the database returns, allowing you to test complex edge cases and failure paths easily.

---

## Copy-Pasteable Vitest Service Template

Here is a standardized template you can copy and modify when writing tests for newly created backend services:

```ts
// Illustrative — not from the repo (Copy-pasteable Vitest blueprint)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyTargetService } from '../myTarget.service';

describe('MyTargetService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clear spy records between runs!
  });

  it('should execute business actions successfully', async () => {
    // 1. Arrange: Setup mock data and inputs
    const mockResult = { id: 'test-id', isActive: true };
    const mockTx = {
      myModel: {
        findUnique: vi.fn().mockResolvedValue(mockResult),
        update: vi.fn().mockResolvedValue({ ...mockResult, isActive: false }),
      }
    };

    // 2. Act: Invoke the service method
    const output = await MyTargetService.deactivate('test-id', mockTx as any);

    // 3. Assert: Verify expectations
    expect(output.isActive).toBe(false);
    expect(mockTx.myModel.update).toHaveBeenCalledWith({
      where: { id: 'test-id' },
      data: { isActive: false }
    });
  });
});
```

> **Senior aside:** *Always call `vi.clearAllMocks()` inside a `beforeEach` hook. Failing to clear mock state leads to spy leaks where assertion counts are polluted by calls made in previous test cases.*

---

## Pitfall Checklist

1. **Failing to Clear Mock Spy States**: Neglecting to call `vi.clearAllMocks()`, causing assertion counts to drift between tests.
2. **Mocking the Module Under Test**: Accidental mocking of the very service class you are trying to test.
3. **Hardcoding Timestamps**: Asserting exact timestamp strings (like `new Date()`) instead of checking for instance types (`expect.any(Date)`).
4. **Mismatched Mock Object Structures**: Constructing incomplete mock objects that violate TypeScript definitions, requiring unsafe casts.
5. **No Assertions in Tests**: Writing tests that execute code but contain zero `expect()` assertions, resulting in false-positive passes.
6. **Leaking Timers**: Failing to restore normal timing functions after mocking global timers (`vi.useFakeTimers()`).
7. **Direct Local DB Pollution**: Running test suites that modify the development database directly without cleanups.
8. **Ignoring Rejected Promises**: Failing to assert that rejected promises throw the correct custom error class instances.

---

## Drills

1. **Template Application**: Copy the Vitest service template above and write a mock unit test for a hypothetical `UserService.deactivate` action in your scratchpad.
2. **Mock Integration Verification**: Open [backend/src/modules/onboardingCases/__tests__/onboardingProgress.service.test.ts:41-52](backend/src/modules/onboardingCases/__tests__/onboardingProgress.service.test.ts#L41-L52) and trace how the mock transaction asserts deep object property matches.
3. **Spy assertion write**: Write a test assertion verifying that a mock database `update` function was called exactly once.
