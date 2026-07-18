import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';

export const OnboardingCaseStatus = {
  DRAFT: 'DRAFT',
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  BLOCKED: 'BLOCKED',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type CaseStatus = typeof OnboardingCaseStatus[keyof typeof OnboardingCaseStatus];

const allowedCaseTransitions: Record<CaseStatus, CaseStatus[]> = {
  DRAFT: ['NOT_STARTED', 'CANCELLED'],
  NOT_STARTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['BLOCKED', 'PENDING_APPROVAL', 'COMPLETED', 'CANCELLED'],
  BLOCKED: ['IN_PROGRESS', 'CANCELLED'],
  PENDING_APPROVAL: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Validates whether a state change is allowed by the onboarding state machine.
 */
export function canTransitionCase(from: CaseStatus, to: CaseStatus): boolean {
  return allowedCaseTransitions[from]?.includes(to) || false;
}

/**
 * Throws a Bad Request AppError if the state transition violates the state machine guards.
 */
export function validateCaseTransition(from: CaseStatus, to: CaseStatus) {
  if (from === to) return; // No-op for identical transitions
  if (!canTransitionCase(from, to)) {
    throw new AppError(
      ErrorCodes.INVALID_STATE_TRANSITION,
      400,
      `Invalid onboarding case transition: from ${from} to ${to}`
    );
  }
}

export default {
  OnboardingCaseStatus,
  canTransitionCase,
  validateCaseTransition,
};
