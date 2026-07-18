import { prisma } from '../../db/prisma';

export class OnboardingProgressService {
  /**
   * Recalculates and stores progress percentage of an onboarding case based on task completions.
   * Can accept a Prisma transaction transaction context.
   */
  static async recalculateOnboardingProgress(caseId: string, tx: any = prisma): Promise<number> {
    const tasks = await tx.onboardingTask.findMany({
      where: { onboardingCaseId: caseId }
    });

    const total = tasks.length;
    if (total === 0) {
      return 0;
    }

    const completed = tasks.filter(
      (task: any) => task.status === 'COMPLETED' || task.status === 'SKIPPED'
    ).length;

    const progress = Math.round((completed / total) * 100);

    // Fetch the current case details to check if it's already COMPLETED
    const currentCase = await tx.onboardingCase.findUnique({
      where: { id: caseId },
      select: { status: true, completedAt: true }
    });

    const isNewlyCompleted = progress === 100;
    
    // Derived updates: only update status/completedAt if transitioning or if not completed yet
    const data: any = {
      progressPercent: progress,
    };

    if (isNewlyCompleted) {
      data.status = 'COMPLETED';
      // Set completedAt only if it wasn't already set to preserve original history
      if (!currentCase.completedAt) {
        data.completedAt = new Date();
      }
    } else {
      // Senior Lesson: if a completed case is reopened, do not blindly null completedAt unless requested.
      // We will keep status as IN_PROGRESS if progress < 100% and it was COMPLETED previously.
      if (currentCase.status === 'COMPLETED') {
        data.status = 'IN_PROGRESS';
      }
    }

    await tx.onboardingCase.update({
      where: { id: caseId },
      data,
    });

    return progress;
  }
}

export default OnboardingProgressService;
