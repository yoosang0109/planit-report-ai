-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TEACHER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL DEFAULT 'OTHER',
    "school" TEXT,
    "subject" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "parentName" TEXT,
    "parentPhone" TEXT,
    "defaultTone" TEXT NOT NULL DEFAULT 'FRIENDLY',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "userId" TEXT,
    "subject" TEXT NOT NULL DEFAULT '',
    "weekStart" DATETIME NOT NULL,
    "weekEnd" DATETIME NOT NULL,
    "classContent" TEXT NOT NULL,
    "homeworkStatus" TEXT NOT NULL DEFAULT 'NOT_ASSIGNED',
    "homeworkNote" TEXT,
    "testScore" INTEGER,
    "attitude" TEXT NOT NULL DEFAULT 'GOOD',
    "understanding" TEXT NOT NULL DEFAULT 'GOOD',
    "absenceStatus" TEXT NOT NULL DEFAULT 'PRESENT',
    "makeupClassStatus" TEXT NOT NULL DEFAULT 'NOT_NEEDED',
    "nextPlan" TEXT,
    "teacherKeywords" TEXT,
    "parentReportText" TEXT,
    "internalMemoText" TEXT,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reports_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
