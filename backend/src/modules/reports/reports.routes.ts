import { Router } from 'express';
import { ReportingController } from './reports.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

// Secure all reporting endpoints
router.use(authMiddleware);
router.use(requirePermission('VIEW_REPORTS')); // SYSTEM_ADMIN, HR_ADMIN, HR_SPECIALIST

router.get(
  '/cases',
  asyncHandler(ReportingController.getCasesSummary)
);

router.get(
  '/departments',
  asyncHandler(ReportingController.getDepartmentMetrics)
);

router.get(
  '/tasks',
  asyncHandler(ReportingController.getTasksSummary)
);

export default router;
export { router as reportsRouter };
