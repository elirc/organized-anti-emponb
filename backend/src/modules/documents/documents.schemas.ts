import { z } from 'zod';

export const createDocumentSchema = z.object({
  onboardingCaseId: z.string().uuid('Invalid onboarding case reference'),
  title: z.string().min(1, 'Document title is required'),
  category: z.string().min(1, 'Document category is required'),
});

export const reviewDocumentSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: 'Status must be APPROVED or REJECTED' }),
  }),
  remarks: z.string().max(500, 'Remarks cannot exceed 500 characters').optional().nullable(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type ReviewDocumentInput = z.infer<typeof reviewDocumentSchema>;
