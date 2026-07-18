import { Router } from 'express';
import { ApprovalController } from './approvals.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { decideApprovalSchema } from './approvals.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

// Secure all approval endpoints
router.use(authMiddleware);

router.get(
  '/',
  asyncHandler(ApprovalController.getAll)
);

router.post(
  '/:id/decide',
  validate(decideApprovalSchema),
  asyncHandler(ApprovalController.decide)
);

export default router;
export { router as approvalsRouter };
