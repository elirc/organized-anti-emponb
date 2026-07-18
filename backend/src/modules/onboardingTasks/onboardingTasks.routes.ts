import { Router } from 'express';
import { OnboardingTasksController } from './onboardingTasks.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateTaskSchema } from './onboardingTasks.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

// Apply authentication to all task routes
router.use(authMiddleware);

router.get(
  '/',
  asyncHandler(OnboardingTasksController.getAll)
);

router.get(
  '/:id',
  asyncHandler(OnboardingTasksController.getById)
);

router.patch(
  '/:id',
  validate(updateTaskSchema),
  asyncHandler(OnboardingTasksController.update)
);

export default router;
export { router as onboardingTasksRouter };
