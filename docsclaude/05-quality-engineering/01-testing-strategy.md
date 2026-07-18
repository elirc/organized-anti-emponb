# Automated Verification and Safety Nets: Testing Strategy

Writing code without writing automated tests is like walking a tightrope without a safety net. A junior engineer who relies solely on manual validation invites regression bugs and makes refactoring core architectures high-risk.

---

## The Testing Pyramid Architecture

A mature automated verification suite spreads tests across three distinct layers:

```mermaid
graph TD
  E2E[End-to-End Tests: User flows, Playwright]
  Integration[Integration Tests: REST APIs, DB transactions]
  Unit[Unit Tests: State machines, pure utilities]

  Unit -->|High speed, high volume| Integration
  Integration -->|Medium speed, medium volume| E2E
  E2E -->|Low speed, low volume| [*]
```

1. **Unit Tests (80%)**: Focus on testing pure functions, isolated domain algorithms, and helper utilities. Unit tests execute in milliseconds using mocks.
2. **Integration Tests (15%)**: Verify boundary components (such as API routers, controller validations, or database queries) against actual databases.
3. **End-to-End (E2E) Tests (5%)**: Run fully compiled frontends against live backends using automated browsers (like Playwright), mimicking user clicks.

---

## Efficacy over Coverage Metrics

Many engineering teams fall into the trap of requiring "100% code coverage." This leads to developers writing low-quality assertions that satisfy coverage metrics without actually testing boundary limits.

Look at our real state machine unit tests:
[backend/src/modules/onboardingCases/__tests__/onboardingCase.stateMachine.test.ts:5-12](backend/src/modules/onboardingCases/__tests__/onboardingCase.stateMachine.test.ts#L5-L12):

```typescript
describe('Onboarding Case State Machine', () => {
  it('should allow valid status transitions', () => {
    expect(canTransitionCase('DRAFT', 'NOT_STARTED')).toBe(true);
    expect(canTransitionCase('NOT_STARTED', 'IN_PROGRESS')).toBe(true);
    expect(canTransitionCase('IN_PROGRESS', 'PENDING_APPROVAL')).toBe(true);
    expect(canTransitionCase('PENDING_APPROVAL', 'COMPLETED')).toBe(true);
  });
```

### Why These Unit Tests Are High-Efficacy:
1. **Focus on Boundary Invariants**: They test critical platform invariants (such as valid and invalid state transitions) that protect database status columns from corruption.
2. **Lightning-Fast Execution**: The test executes in less than 2 milliseconds because it reads only local javascript objects, containing zero external connection overhead.

> **Senior aside:** *Always prioritize testing core business invariants and boundary error limits over testing trivial getters and setters. High-quality assertions protect code; high coverage numbers protect nothing.*

---

## Pitfall Checklist

1. **Testing Implementation Details**: Asserting internal variable configurations instead of focusing on function outputs and state changes.
2. **Bloated Mocking Chains**: Over-mocking modules until the tests verify only mock structures instead of real code.
3. **Mismatched Database State**: Failing to clean up integration database rows between tests, resulting in collision errors.
4. **Flaky Timing Tests**: Using loose timeouts inside async assertions, causing tests to fail randomly on slower servers.
5. **No Negative Assertions**: Testing only successful paths ("happy paths") while ignoring boundary error conditions.
6. **Hardcoded Random Values**: Utilizing active, real database IDs inside tests instead of UUID generators or scoped variables.
7. **Ignoring Test Cleanups**: Failing to clear mock functions (`vi.clearAllMocks()`) between test suites, resulting in side effects.
8. **No Global Execution Safety Checks**: Disabling compiler typings inside tests to skip structural declarations.

---

## Drills

1. **Test Suite Inspection**: Open [backend/src/modules/onboardingCases/__tests__/onboardingProgress.service.test.ts](backend/src/modules/onboardingCases/__tests__/onboardingProgress.service.test.ts) and identify the mock boundaries used to isolate database writes.
2. **Assertion Design**: Write a new unit test assertion that verifies `canTransitionCase` returns `false` when attempting to transition a case directly from `DRAFT` to `COMPLETED`.
3. **Test Command Audit**: Run the Vitest unit tests in your local environment. Verify the exact duration and memory footprints logged by the test runner.
