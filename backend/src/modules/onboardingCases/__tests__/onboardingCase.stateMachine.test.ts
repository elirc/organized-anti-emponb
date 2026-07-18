import { describe, it, expect } from 'vitest';
import { canTransitionCase, validateCaseTransition } from '../onboardingCase.stateMachine';
import { AppError } from '../../../shared/errors/AppError';

describe('Onboarding Case State Machine', () => {
  it('should allow valid status transitions', () => {
    expect(canTransitionCase('DRAFT', 'NOT_STARTED')).toBe(true);
    expect(canTransitionCase('NOT_STARTED', 'IN_PROGRESS')).toBe(true);
    expect(canTransitionCase('IN_PROGRESS', 'PENDING_APPROVAL')).toBe(true);
    expect(canTransitionCase('PENDING_APPROVAL', 'COMPLETED')).toBe(true);
  });

  it('should deny invalid status transitions', () => {
    expect(canTransitionCase('COMPLETED', 'IN_PROGRESS')).toBe(false);
    expect(canTransitionCase('DRAFT', 'COMPLETED')).toBe(false);
    expect(canTransitionCase('CANCELLED', 'DRAFT')).toBe(false);
  });

  it('should not throw on identical state transition', () => {
    expect(() => validateCaseTransition('IN_PROGRESS', 'IN_PROGRESS')).not.toThrow();
  });

  it('should throw AppError on invalid transition', () => {
    expect(() => validateCaseTransition('DRAFT', 'COMPLETED')).toThrow(AppError);
  });
});
