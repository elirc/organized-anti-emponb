import { Router } from 'express';
import { DocumentController } from './documents.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { upload } from '../../middleware/upload.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createDocumentSchema, reviewDocumentSchema } from './documents.schemas';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

// Secure all document endpoints
router.use(authMiddleware);

router.get(
  '/',
  asyncHandler(DocumentController.getAll)
);

router.get(
  '/:id',
  asyncHandler(DocumentController.getById)
);

router.post(
  '/upload',
  upload.single('file'), // Multer parses file stream
  validate(createDocumentSchema),
  asyncHandler(DocumentController.upload)
);

router.post(
  '/:id/review',
  validate(reviewDocumentSchema),
  asyncHandler(DocumentController.review)
);

export default router;
export { router as documentsRouter };
