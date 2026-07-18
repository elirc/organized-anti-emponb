import { Router } from 'express';
import { DepartmentController } from './departments.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createDepartmentSchema, updateDepartmentSchema } from './departments.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

// Apply auth protection to all department operations
router.use(authMiddleware);

router.get(
  '/',
  asyncHandler(DepartmentController.getAll)
);

router.get(
  '/:id',
  asyncHandler(DepartmentController.getById)
);

router.post(
  '/',
  requirePermission('MANAGE_USERS'), // SYSTEM_ADMIN & HR_ADMIN
  validate(createDepartmentSchema),
  asyncHandler(DepartmentController.create)
);

router.patch(
  '/:id',
  requirePermission('MANAGE_USERS'),
  validate(updateDepartmentSchema),
  asyncHandler(DepartmentController.update)
);

router.delete(
  '/:id',
  requirePermission('MANAGE_USERS'),
  asyncHandler(DepartmentController.delete)
);

export default router;
export { router as departmentsRouter };
