-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "Document_onboardingCaseId_fkey" FOREIGN KEY ("onboardingCaseId") REFERENCES "OnboardingCase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("category", "createdAt", "fileName", "fileUrl", "id", "onboardingCaseId", "remarks", "reviewedById", "status", "title", "updatedAt", "uploadedById") SELECT "category", "createdAt", "fileName", "fileUrl", "id", "onboardingCaseId", "remarks", "reviewedById", "status", "title", "updatedAt", "uploadedById" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE INDEX "Document_onboardingCaseId_idx" ON "Document"("onboardingCaseId");
CREATE INDEX "Document_status_idx" ON "Document"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
