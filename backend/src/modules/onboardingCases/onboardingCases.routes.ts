import { Router } from 'express';
import { OnboardingCasesController } from './onboardingCases.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createOnboardingCaseSchema,
  updateOnboardingCaseSchema,
  updateCaseStatusSchema,
} from './onboardingCases.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

// Secure all case endpoints
router.use(authMiddleware);

router.get(
  '/',
  asyncHandler(OnboardingCasesController.getAll)
);

router.get(
  '/:id',
  asyncHandler(OnboardingCasesController.getById)
);

router.post(
  '/',
  requirePermission('CREATE_ONBOARDING_CASE'), // Admins & HR only
  validate(createOnboardingCaseSchema),
  asyncHandler(OnboardingCasesController.create)
);

router.patch(
  '/:id',
  requirePermission('CREATE_ONBOARDING_CASE'),
  validate(updateOnboardingCaseSchema),
  asyncHandler(OnboardingCasesController.update)
);

router.post(
  '/:id/start',
  requirePermission('CREATE_ONBOARDING_CASE'),
  asyncHandler(OnboardingCasesController.start)
);

router.post(
  '/:id/status',
  requirePermission('CREATE_ONBOARDING_CASE'),
  validate(updateCaseStatusSchema),
  asyncHandler(OnboardingCasesController.updateStatus)
);

export default router;
export { router as onboardingCasesRouter };
