import { prisma } from '../../db/prisma';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { CreateEmployeeProfileInput, UpdateEmployeeProfileInput } from './employeeProfiles.schemas';

export class EmployeeProfileService {
  static async getAll() {
    return prisma.employeeProfile.findMany({
      orderBy: { startDate: 'asc' },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true }
        },
        onboardingCases: {
          select: { id: true, status: true, progressPercent: true }
        }
      }
    });
  }

  static async getById(id: string) {
    const profile = await prisma.employeeProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true }
        },
        onboardingCases: {
          select: { id: true, status: true, progressPercent: true, department: true }
        }
      }
    });

    if (!profile) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Employee profile not found');
    }

    return profile;
  }

  static async create(input: CreateEmployeeProfileInput) {
    if (input.userId) {
      const user = await prisma.user.findUnique({ where: { id: input.userId } });
      if (!user) {
        throw new AppError(ErrorCodes.NOT_FOUND, 404, 'User account not found');
      }

      // Check if user already linked to a profile
      const linked = await prisma.employeeProfile.findUnique({
        where: { userId: input.userId },
      });
      if (linked) {
        throw new AppError(ErrorCodes.BAD_REQUEST, 400, 'User is already associated with an employee profile');
      }
    }

    return prisma.employeeProfile.create({
      data: {
        userId: input.userId,
        legalFirstName: input.legalFirstName,
        legalLastName: input.legalLastName,
        preferredName: input.preferredName,
        personalEmail: input.personalEmail,
        phone: input.phone,
        jobTitle: input.jobTitle,
        employmentType: input.employmentType,
        startDate: new Date(input.startDate),
      },
    });
  }

  static async update(id: string, input: UpdateEmployeeProfileInput) {
    const profile = await this.getById(id);

    if (input.userId && input.userId !== profile.userId) {
      const user = await prisma.user.findUnique({ where: { id: input.userId } });
      if (!user) {
        throw new AppError(ErrorCodes.NOT_FOUND, 404, 'User account not found');
      }

      const linked = await prisma.employeeProfile.findUnique({
        where: { userId: input.userId },
      });
      if (linked) {
        throw new AppError(ErrorCodes.BAD_REQUEST, 400, 'User is already associated with another employee profile');
      }
    }

    return prisma.employeeProfile.update({
      where: { id },
      data: {
        userId: input.userId !== undefined ? input.userId : profile.userId,
        legalFirstName: input.legalFirstName || profile.legalFirstName,
        legalLastName: input.legalLastName || profile.legalLastName,
        preferredName: input.preferredName !== undefined ? input.preferredName : profile.preferredName,
        personalEmail: input.personalEmail !== undefined ? input.personalEmail : profile.personalEmail,
        phone: input.phone !== undefined ? input.phone : profile.phone,
        jobTitle: input.jobTitle || profile.jobTitle,
        employmentType: input.employmentType || profile.employmentType,
        startDate: input.startDate ? new Date(input.startDate) : profile.startDate,
      },
    });
  }
}
export default EmployeeProfileService;
