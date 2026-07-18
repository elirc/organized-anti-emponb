import { z } from 'zod';

export const updateTaskSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'], {
    errorMap: () => ({ message: 'Invalid task status' }),
  }).optional(),
  assignedToId: z.string().uuid('Invalid user account reference').optional().nullable(),
  title: z.string().min(1, 'Task title is required').optional(),
  description: z.string().optional().nullable(),
  dueDate: z.string().datetime({ message: 'Due date must be a valid ISO datetime' }).optional().nullable(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export default updateTaskSchema;
