import { z } from 'zod';

export const createOnboardingCaseSchema = z.object({
  employeeProfileId: z.string().uuid('Invalid employee profile reference'),
  departmentId: z.string().uuid('Invalid department reference'),
  workflowTemplateId: z.string().uuid('Invalid workflow template reference'),
  startDate: z.string().datetime({ message: 'Start date must be a valid ISO datetime' }),
});

export const updateOnboardingCaseSchema = z.object({
  departmentId: z.string().uuid('Invalid department reference').optional(),
  workflowTemplateId: z.string().uuid('Invalid workflow template reference').optional(),
  startDate: z.string().datetime({ message: 'Start date must be a valid ISO datetime' }).optional(),
  status: z.enum([
    'DRAFT',
    'NOT_STARTED',
    'IN_PROGRESS',
    'BLOCKED',
    'PENDING_APPROVAL',
    'COMPLETED',
    'CANCELLED',
  ]).optional(),
});

export const updateCaseStatusSchema = z.object({
  status: z.enum([
    'DRAFT',
    'NOT_STARTED',
    'IN_PROGRESS',
    'BLOCKED',
    'PENDING_APPROVAL',
    'COMPLETED',
    'CANCELLED',
  ], {
    errorMap: () => ({ message: 'Invalid onboarding case status' }),
  }),
});

export type CreateOnboardingCaseInput = z.infer<typeof createOnboardingCaseSchema>;
export type UpdateOnboardingCaseInput = z.infer<typeof updateOnboardingCaseSchema>;
export type UpdateCaseStatusInput = z.infer<typeof updateCaseStatusSchema>;
