import { z } from 'zod';

export const decideApprovalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: 'Decision must be APPROVED or REJECTED' }),
  }),
  remarks: z.string().max(500, 'Remarks cannot exceed 500 characters').optional().nullable(),
});

export type DecideApprovalInput = z.infer<typeof decideApprovalSchema>;
export default decideApprovalSchema;
