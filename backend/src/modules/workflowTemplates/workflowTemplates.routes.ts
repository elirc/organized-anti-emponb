import { Router } from 'express';
import { WorkflowTemplateController } from './workflowTemplates.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/requirePermission.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createWorkflowTemplateSchema,
  updateWorkflowTemplateSchema,
  createStageTemplateSchema,
  createTaskTemplateSchema,
} from './workflowTemplates.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

// Apply auth protecting all template operations
router.use(authMiddleware);

router.get(
  '/',
  asyncHandler(WorkflowTemplateController.getAll)
);

router.get(
  '/:id',
  asyncHandler(WorkflowTemplateController.getById)
);

router.post(
  '/',
  requirePermission('CREATE_ONBOARDING_CASE'), // Admins & HR only
  validate(createWorkflowTemplateSchema),
  asyncHandler(WorkflowTemplateController.create)
);

router.patch(
  '/:id',
  requirePermission('CREATE_ONBOARDING_CASE'),
  validate(updateWorkflowTemplateSchema),
  asyncHandler(WorkflowTemplateController.update)
);

router.delete(
  '/:id',
  requirePermission('CREATE_ONBOARDING_CASE'),
  asyncHandler(WorkflowTemplateController.delete)
);

router.post(
  '/:id/stages',
  requirePermission('CREATE_ONBOARDING_CASE'),
  validate(createStageTemplateSchema),
  asyncHandler(WorkflowTemplateController.createStage)
);

router.post(
  '/:id/task-templates',
  requirePermission('CREATE_ONBOARDING_CASE'),
  validate(createTaskTemplateSchema),
  asyncHandler(WorkflowTemplateController.createTaskTemplate)
);

export default router;
export { router as workflowTemplatesRouter };
