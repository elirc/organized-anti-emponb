import { Router } from 'express';
import { UserController } from './users.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createUserSchema, updateUserSchema } from './users.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

// Secure all user endpoints
router.use(authMiddleware);

router.get(
  '/',
  asyncHandler(UserController.getAll)
);

router.get(
  '/:id',
  asyncHandler(UserController.getById)
);

router.post(
  '/',
  requirePermission('MANAGE_USERS'),
  validate(createUserSchema),
  asyncHandler(UserController.create)
);

router.patch(
  '/:id',
  requirePermission('MANAGE_USERS'),
  validate(updateUserSchema),
  asyncHandler(UserController.update)
);

router.delete(
  '/:id',
  requirePermission('MANAGE_USERS'),
  asyncHandler(UserController.delete)
);

export default router;
export { router as usersRouter };
