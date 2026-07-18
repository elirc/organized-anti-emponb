import { Router } from 'express';
import { EmployeeProfileController } from './employeeProfiles.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createEmployeeProfileSchema, updateEmployeeProfileSchema } from './employeeProfiles.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

// Secure all endpoints
router.use(authMiddleware);

router.get(
  '/',
  asyncHandler(EmployeeProfileController.getAll)
);

router.get(
  '/:id',
  asyncHandler(EmployeeProfileController.getById)
);

router.post(
  '/',
  requirePermission('CREATE_ONBOARDING_CASE'), // HR staff and admins only
  validate(createEmployeeProfileSchema),
  asyncHandler(EmployeeProfileController.create)
);

router.patch(
  '/:id',
  requirePermission('CREATE_ONBOARDING_CASE'), // HR staff and admins only
  validate(updateEmployeeProfileSchema),
  asyncHandler(EmployeeProfileController.update)
);

export default router;
export { router as employeeProfilesRouter };
