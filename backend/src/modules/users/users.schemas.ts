import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum([
    'SYSTEM_ADMIN',
    'HR_ADMIN',
    'HR_SPECIALIST',
    'MANAGER',
    'IT_ADMIN',
    'PAYROLL_ADMIN',
    'EMPLOYEE',
  ], {
    errorMap: () => ({ message: 'Invalid role selection' }),
  }),
  departmentId: z.string().uuid('Invalid department reference').optional().nullable(),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  role: z.enum([
    'SYSTEM_ADMIN',
    'HR_ADMIN',
    'HR_SPECIALIST',
    'MANAGER',
    'IT_ADMIN',
    'PAYROLL_ADMIN',
    'EMPLOYEE',
  ]).optional(),
  departmentId: z.string().uuid('Invalid department reference').optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
