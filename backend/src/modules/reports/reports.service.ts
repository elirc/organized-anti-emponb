import { prisma } from '../../db/prisma';

export class ReportingService {
  /**
   * Onboarding cases aggregations by status.
   */
  static async getCasesSummary() {
    const statusCounts = await prisma.onboardingCase.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const summary: Record<string, number> = {
      DRAFT: 0,
      NOT_STARTED: 0,
      IN_PROGRESS: 0,
      BLOCKED: 0,
      PENDING_APPROVAL: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      total: 0,
    };

    let total = 0;
    for (const item of statusCounts) {
      summary[item.status] = item._count._all;
      total += item._count._all;
    }
    summary.total = total;

    return summary;
  }

  /**
   * Performance metrics per department, including average onboarding cycle time.
   */
  static async getDepartmentMetrics() {
    const departments = await prisma.department.findMany({
      include: {
        cases: {
          select: {
            id: true,
            status: true,
            startDate: true,
            completedAt: true,
          }
        }
      }
    });

    return departments.map((dept) => {
      const cases = dept.cases;
      const completedCases = cases.filter((c) => c.status === 'COMPLETED' && c.completedAt);
      
      let averageDurationDays = 0;
      if (completedCases.length > 0) {
        const totalDurationMs = completedCases.reduce((acc, c) => {
          const start = new Date(c.startDate).getTime();
          const end = new Date(c.completedAt!).getTime();
          return acc + (end - start);
        }, 0);

        const averageDurationMs = totalDurationMs / completedCases.length;
        averageDurationDays = Math.round((averageDurationMs / (1000 * 60 * 60 * 24)) * 10) / 10;
      }

      return {
        id: dept.id,
        name: dept.name,
        totalCases: cases.length,
        activeCases: cases.filter((c) => ['IN_PROGRESS', 'PENDING_APPROVAL', 'BLOCKED'].includes(c.status)).length,
        completedCases: completedCases.length,
        averageDurationDays,
      };
    });
  }

  /**
   * Operations task checklist report, checking status counts and overdue tallies.
   */
  static async getTasksSummary() {
    const statusCounts = await prisma.onboardingTask.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const overdueCount = await prisma.onboardingTask.count({
      where: {
        status: { notIn: ['COMPLETED', 'SKIPPED'] },
        dueDate: { lt: new Date() },
      }
    });

    const summary: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      PENDING_APPROVAL: 0,
      COMPLETED: 0,
      SKIPPED: 0,
      overdue: overdueCount,
    };

    for (const item of statusCounts) {
      summary[item.status] = item._count._all;
    }

    return summary;
  }
}
export default ReportingService;
