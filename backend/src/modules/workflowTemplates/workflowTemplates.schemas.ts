import { z } from 'zod';

export const createWorkflowTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional().nullable(),
});

export const updateWorkflowTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const createStageTemplateSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  description: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().min(1),
});

export const createTaskTemplateSchema = z.object({
  stageTemplateId: z.string().uuid('Invalid stage template reference'),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional().nullable(),
  defaultAssigneeRole: z.enum([
    'SYSTEM_ADMIN',
    'HR_ADMIN',
    'HR_SPECIALIST',
    'MANAGER',
    'IT_ADMIN',
    'PAYROLL_ADMIN',
    'EMPLOYEE',
  ]).optional().nullable(),
  taskType: z.enum([
    'HR',
    'IT',
    'PAYROLL',
    'MANAGER',
    'EMPLOYEE',
    'DOCUMENT',
    'APPROVAL',
  ], {
    errorMap: () => ({ message: 'Invalid task type' }),
  }),
  requiresApproval: z.boolean().default(false),
  dueOffsetDays: z.coerce.number().int().optional().nullable(),
  sortOrder: z.coerce.number().int().min(1),
});

export type CreateWorkflowTemplateInput = z.infer<typeof createWorkflowTemplateSchema>;
export type UpdateWorkflowTemplateInput = z.infer<typeof updateWorkflowTemplateSchema>;
export type CreateStageTemplateInput = z.infer<typeof createStageTemplateSchema>;
export type CreateTaskTemplateInput = z.infer<typeof createTaskTemplateSchema>;
