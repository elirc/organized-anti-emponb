/*
  Warnings:

  - You are about to drop the column `decisionNote` on the `Approval` table. All the data in the column will be lost.
  - You are about to drop the column `documentType` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionReason` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `reviewStatus` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `sizeBytes` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `recipientEmail` on the `EmailNotification` table. All the data in the column will be lost.
  - Made the column `taskId` on table `Approval` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `category` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipient` to the `EmailNotification` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Approval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "onboardingCaseId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "approverId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" DATETIME,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Approval_onboardingCaseId_fkey" FOREIGN KEY ("onboardingCaseId") REFERENCES "OnboardingCase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Approval_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "OnboardingTask" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Approval" ("approverId", "createdAt", "decidedAt", "id", "onboardingCaseId", "requestedAt", "status", "taskId", "updatedAt") SELECT "approverId", "createdAt", "decidedAt", "id", "onboardingCaseId", "requestedAt", "status", "taskId", "updatedAt" FROM "Approval";
DROP TABLE "Approval";
ALTER TABLE "new_Approval" RENAME TO "Approval";
CREATE INDEX "Approval_onboardingCaseId_idx" ON "Approval"("onboardingCaseId");
CREATE INDEX "Approval_taskId_idx" ON "Approval"("taskId");
CREATE INDEX "Approval_approverId_idx" ON "Approval"("approverId");
CREATE INDEX "Approval_status_idx" ON "Approval"("status");
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "onboardingCaseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "uploadedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_onboardingCaseId_fkey" FOREIGN KEY ("onboardingCaseId") REFERENCES "OnboardingCase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("createdAt", "fileName", "fileUrl", "id", "onboardingCaseId", "reviewedById", "updatedAt", "uploadedById") SELECT "createdAt", "fileName", "fileUrl", "id", "onboardingCaseId", "reviewedById", "updatedAt", "uploadedById" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE INDEX "Document_onboardingCaseId_idx" ON "Document"("onboardingCaseId");
CREATE INDEX "Document_status_idx" ON "Document"("status");
CREATE TABLE "new_EmailNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "onboardingCaseId" TEXT,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_EmailNotification" ("attempts", "body", "createdAt", "id", "lastError", "sentAt", "status", "subject", "updatedAt") SELECT "attempts", "body", "createdAt", "id", "lastError", "sentAt", "status", "subject", "updatedAt" FROM "EmailNotification";
DROP TABLE "EmailNotification";
ALTER TABLE "new_EmailNotification" RENAME TO "EmailNotification";
CREATE INDEX "EmailNotification_status_idx" ON "EmailNotification"("status");
CREATE TABLE "new_OnboardingTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "onboardingCaseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "taskType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "assignedToId" TEXT,
    "assignedRole" TEXT,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "completedById" TEXT,
    "blockedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OnboardingTask_onboardingCaseId_fkey" FOREIGN KEY ("onboardingCaseId") REFERENCES "OnboardingCase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OnboardingTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OnboardingTask" ("assignedRole", "assignedToId", "blockedReason", "completedAt", "createdAt", "description", "dueDate", "id", "onboardingCaseId", "status", "taskType", "title", "updatedAt") SELECT "assignedRole", "assignedToId", "blockedReason", "completedAt", "createdAt", "description", "dueDate", "id", "onboardingCaseId", "status", "taskType", "title", "updatedAt" FROM "OnboardingTask";
DROP TABLE "OnboardingTask";
ALTER TABLE "new_OnboardingTask" RENAME TO "OnboardingTask";
CREATE INDEX "OnboardingTask_onboardingCaseId_idx" ON "OnboardingTask"("onboardingCaseId");
CREATE INDEX "OnboardingTask_assignedToId_idx" ON "OnboardingTask"("assignedToId");
CREATE INDEX "OnboardingTask_status_idx" ON "OnboardingTask"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
