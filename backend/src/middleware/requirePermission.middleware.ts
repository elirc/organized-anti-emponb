import { Response, NextFunction, RequestHandler } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { AppError } from '../shared/errors/AppError';
import { ErrorCodes } from '../shared/errors/errorCodes';

export const Roles = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  HR_ADMIN: 'HR_ADMIN',
  HR_SPECIALIST: 'HR_SPECIALIST',
  MANAGER: 'MANAGER',
  IT_ADMIN: 'IT_ADMIN',
  PAYROLL_ADMIN: 'PAYROLL_ADMIN',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type UserRole = typeof Roles[keyof typeof Roles];

// Dynamic Permission Matrix aligning with Section 8 permission rules
export const PermissionMatrix: Record<string, UserRole[]> = {
  MANAGE_USERS: [Roles.SYSTEM_ADMIN, Roles.HR_ADMIN],
  CREATE_ONBOARDING_CASE: [Roles.SYSTEM_ADMIN, Roles.HR_ADMIN, Roles.HR_SPECIALIST],
  VIEW_ALL_CASES: [Roles.SYSTEM_ADMIN, Roles.HR_ADMIN, Roles.HR_SPECIALIST],
  VIEW_AUDIT_LOGS: [Roles.SYSTEM_ADMIN, Roles.HR_ADMIN],
  VIEW_REPORTS: [Roles.SYSTEM_ADMIN, Roles.HR_ADMIN, Roles.HR_SPECIALIST],
  
  // Tasks completions permissions
  APPROVE_MANAGER_STEP: [Roles.SYSTEM_ADMIN, Roles.MANAGER],
  COMPLETE_IT_TASK: [Roles.SYSTEM_ADMIN, Roles.IT_ADMIN],
  COMPLETE_PAYROLL_TASK: [Roles.SYSTEM_ADMIN, Roles.PAYROLL_ADMIN],
};

/**
 * Standard Role-based route guard.
 */
export const requireRole = (allowedRoles: UserRole[]): RequestHandler => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(ErrorCodes.UNAUTHORIZED, 401, 'Authentication required');
      }

      if (!allowedRoles.includes(req.user.role as UserRole)) {
        throw new AppError(ErrorCodes.FORBIDDEN, 403, 'Access denied: insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Matrix permission guard checking explicit action rights.
 */
export const requirePermission = (permission: keyof typeof PermissionMatrix): RequestHandler => {
  const allowedRoles = PermissionMatrix[permission];
  return requireRole(allowedRoles);
};

export default {
  requireRole,
  requirePermission,
  Roles,
};
