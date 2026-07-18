import { prisma } from '../../db/prisma';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { CreateDocumentInput, ReviewDocumentInput } from './documents.schemas';

export class DocumentService {
  /**
   * List uploaded documents, with filters.
   */
  static async getAll(filters: { onboardingCaseId?: string }) {
    const where: any = {};
    if (filters.onboardingCaseId) {
      where.onboardingCaseId = filters.onboardingCaseId;
    }

    return prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });
  }

  /**
   * Fetch single document details.
   */
  static async getById(id: string) {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    if (!doc) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Document not found');
    }

    return doc;
  }

  /**
   * Create document record associated with active onboarding case.
   */
  static async upload(
    input: CreateDocumentInput,
    file: Express.Multer.File,
    uploaderId: string
  ) {
    const onboardingCase = await prisma.onboardingCase.findUnique({
      where: { id: input.onboardingCaseId }
    });

    if (!onboardingCase) {
      throw new AppError(ErrorCodes.CASE_NOT_FOUND, 404, 'Onboarding case not found');
    }

    const fileUrl = `/uploads/${file.filename}`;

    const doc = await prisma.document.create({
      data: {
        onboardingCaseId: input.onboardingCaseId,
        title: input.title,
        fileName: file.originalname,
        fileUrl,
        category: input.category,
        status: 'PENDING',
        uploadedById: uploaderId,
      },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    // Create activity log
    await prisma.onboardingActivity.create({
      data: {
        onboardingCaseId: input.onboardingCaseId,
        actorId: uploaderId,
        action: 'DOCUMENT_UPLOADED',
        entityType: 'Document',
        entityId: doc.id,
        newValue: doc.title,
      }
    });

    return doc;
  }

  /**
   * Review upload (APPROVE / REJECT).
   */
  static async review(id: string, input: ReviewDocumentInput, reviewerId: string) {
    const doc = await prisma.document.findUnique({
      where: { id }
    });

    if (!doc) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Document not found');
    }

    if (doc.status !== 'PENDING') {
      throw new AppError(ErrorCodes.BAD_REQUEST, 400, 'Document has already been reviewed');
    }

    const updatedDoc = await prisma.document.update({
      where: { id },
      data: {
        status: input.status,
        remarks: input.remarks,
        reviewedById: reviewerId,
      },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      }
    });

    // Create user-facing activity log
    await prisma.onboardingActivity.create({
      data: {
        onboardingCaseId: doc.onboardingCaseId,
        actorId: reviewerId,
        action: `DOCUMENT_${input.status}`,
        entityType: 'Document',
        entityId: doc.id,
        newValue: input.remarks || 'Reviewed.',
      }
    });

    // Log compliance audit event
    await prisma.auditEvent.create({
      data: {
        actorId: reviewerId,
        entityType: 'Document',
        entityId: doc.id,
        action: `DOCUMENT_REVIEW_${input.status}`,
        metadata: JSON.stringify({
          documentTitle: doc.title,
          caseId: doc.onboardingCaseId,
          remarks: input.remarks,
        }),
      }
    });

    return updatedDoc;
  }
}
export default DocumentService;
