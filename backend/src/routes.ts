import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { departmentsRouter } from './modules/departments/departments.routes';
import { employeeProfilesRouter } from './modules/employeeProfiles/employeeProfiles.routes';
import { workflowTemplatesRouter } from './modules/workflowTemplates/workflowTemplates.routes';
import { onboardingCasesRouter } from './modules/onboardingCases/onboardingCases.routes';
import { onboardingTasksRouter } from './modules/onboardingTasks/onboardingTasks.routes';
import { approvalsRouter } from './modules/approvals/approvals.routes';
import { documentsRouter } from './modules/documents/documents.routes';
import { reportsRouter } from './modules/reports/reports.routes';

const apiRouter = Router();

// Mount modules
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/departments', departmentsRouter);
apiRouter.use('/employee-profiles', employeeProfilesRouter);
apiRouter.use('/workflow-templates', workflowTemplatesRouter);
apiRouter.use('/onboarding-cases', onboardingCasesRouter);
apiRouter.use('/onboarding-tasks', onboardingTasksRouter);
apiRouter.use('/approvals', approvalsRouter);
apiRouter.use('/documents', documentsRouter);
apiRouter.use('/reports', reportsRouter);

// Base API route
apiRouter.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the HR Onboarding Operations API',
    version: '1.0.0'
  });
});

export { apiRouter };
export default apiRouter;
