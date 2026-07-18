import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { registerSchema, loginSchema, refreshSchema } from './auth.schemas';
import { authMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(AuthController.register)
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(AuthController.login)
);

router.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(AuthController.refresh)
);

router.post(
  '/logout',
  validate(refreshSchema),
  asyncHandler(AuthController.logout)
);

router.get(
  '/me',
  authMiddleware,
  asyncHandler(AuthController.me)
);

export default router;
export { router as authRouter };
