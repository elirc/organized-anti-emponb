import { z } from 'zod';

export const createEmployeeProfileSchema = z.object({
  userId: z.string().uuid('Invalid user account reference').optional().nullable(),
  legalFirstName: z.string().min(1, 'Legal first name is required'),
  legalLastName: z.string().min(1, 'Legal last name is required'),
  preferredName: z.string().optional().nullable(),
  personalEmail: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  jobTitle: z.string().min(1, 'Job title is required'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN'], {
    errorMap: () => ({ message: 'Invalid employment type selection' }),
  }),
  startDate: z.string().datetime({ message: 'Start date must be a valid ISO datetime' }),
});

export const updateEmployeeProfileSchema = z.object({
  userId: z.string().uuid('Invalid user account reference').optional().nullable(),
  legalFirstName: z.string().min(1, 'Legal first name is required').optional(),
  legalLastName: z.string().min(1, 'Legal last name is required').optional(),
  preferredName: z.string().optional().nullable(),
  personalEmail: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  jobTitle: z.string().min(1, 'Job title is required').optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN']).optional(),
  startDate: z.string().datetime({ message: 'Start date must be a valid ISO datetime' }).optional(),
});

export type CreateEmployeeProfileInput = z.infer<typeof createEmployeeProfileSchema>;
export type UpdateEmployeeProfileInput = z.infer<typeof updateEmployeeProfileSchema>;
