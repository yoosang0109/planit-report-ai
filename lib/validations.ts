import { z } from "zod";

// ---------------------------------------------------------------------------
// Enum values mirrored from Prisma (kept as const for reuse in UI)
// ---------------------------------------------------------------------------

export const GRADES = [
  { value: "ELEM_1", label: "초1 (Grade 1)" },
  { value: "ELEM_2", label: "초2 (Grade 2)" },
  { value: "ELEM_3", label: "초3 (Grade 3)" },
  { value: "ELEM_4", label: "초4 (Grade 4)" },
  { value: "ELEM_5", label: "초5 (Grade 5)" },
  { value: "ELEM_6", label: "초6 (Grade 6)" },
  { value: "MIDDLE_1", label: "중1 (Middle 1)" },
  { value: "MIDDLE_2", label: "중2 (Middle 2)" },
  { value: "MIDDLE_3", label: "중3 (Middle 3)" },
  { value: "HIGH_1", label: "고1 (High 1)" },
  { value: "HIGH_2", label: "고2 (High 2)" },
  { value: "HIGH_3", label: "고3 (High 3)" },
  { value: "OTHER", label: "기타 (Other)" },
] as const;

export const LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "ELEMENTARY", label: "Elementary" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "UPPER_INTERMEDIATE", label: "Upper-Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
] as const;

export const TONES = [
  { value: "FORMAL", label: "Formal (격식체)" },
  { value: "FRIENDLY", label: "Friendly (친근한)" },
  { value: "ENCOURAGING", label: "Encouraging (격려하는)" },
  { value: "DETAILED", label: "Detailed (상세한)" },
] as const;

export const ATTITUDES = [
  { value: "EXCELLENT", label: "Excellent" },
  { value: "GOOD", label: "Good" },
  { value: "AVERAGE", label: "Average" },
  { value: "NEEDS_IMPROVEMENT", label: "Needs Improvement" },
] as const;

export const HOMEWORK_STATUSES = [
  { value: "COMPLETE", label: "Complete" },
  { value: "INCOMPLETE", label: "Incomplete" },
  { value: "PARTIAL", label: "Partial" },
  { value: "NOT_ASSIGNED", label: "Not Assigned" },
] as const;

export const ABSENCE_STATUSES = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "Late" },
] as const;

export const MAKEUP_STATUSES = [
  { value: "NOT_NEEDED", label: "Not Needed" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "SKIPPED", label: "Skipped" },
] as const;

// ---------------------------------------------------------------------------
// Student schemas
// ---------------------------------------------------------------------------

const gradeEnum = z.enum([
  "ELEM_1", "ELEM_2", "ELEM_3", "ELEM_4", "ELEM_5", "ELEM_6",
  "MIDDLE_1", "MIDDLE_2", "MIDDLE_3",
  "HIGH_1", "HIGH_2", "HIGH_3",
  "OTHER",
]);

const levelEnum = z.enum(["BEGINNER", "ELEMENTARY", "INTERMEDIATE", "UPPER_INTERMEDIATE", "ADVANCED"]);
const toneEnum = z.enum(["FORMAL", "FRIENDLY", "ENCOURAGING", "DETAILED"]);

export const createStudentSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다 (Name is required)"),
  subject: z.string().min(1, "과목은 필수입니다 (Subject is required)"),
  grade: gradeEnum.optional().default("OTHER"),
  school: z.string().optional(),
  level: levelEnum.optional().default("INTERMEDIATE"),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  defaultTone: toneEnum.optional().default("FRIENDLY"),
  notes: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateStudentSchema = createStudentSchema.partial();

// ---------------------------------------------------------------------------
// Report schemas
// ---------------------------------------------------------------------------

export const createReportSchema = z.object({
  studentId: z.string().min(1),
  userId: z.string().optional(),
  weekStart: z.string().datetime(),
  weekEnd: z.string().datetime(),
  classContent: z.string().min(1, "Class content is required"),
  homeworkStatus: z.enum(["COMPLETE", "INCOMPLETE", "PARTIAL", "NOT_ASSIGNED"]).default("NOT_ASSIGNED"),
  homeworkNote: z.string().optional(),
  testScore: z.number().int().min(0).max(100).optional().nullable(),
  attitude: z.enum(["EXCELLENT", "GOOD", "AVERAGE", "NEEDS_IMPROVEMENT"]).default("GOOD"),
  understanding: z.enum(["EXCELLENT", "GOOD", "AVERAGE", "NEEDS_IMPROVEMENT"]).default("GOOD"),
  absenceStatus: z.enum(["PRESENT", "ABSENT", "LATE"]).default("PRESENT"),
  makeupClassStatus: z.enum(["NOT_NEEDED", "SCHEDULED", "COMPLETED", "SKIPPED"]).default("NOT_NEEDED"),
  nextPlan: z.string().optional(),
  teacherKeywords: z.string().optional(),
  parentReportText: z.string().optional(),
  internalMemoText: z.string().optional(),
});

export const updateReportSchema = createReportSchema.partial().extend({
  parentReportText: z.string().optional(),
  internalMemoText: z.string().optional(),
  isSent: z.boolean().optional(),
});

export const generateReportSchema = z.object({
  reportId: z.string().min(1),
  type: z.enum(["PARENT_KOREAN", "TEACHER_NOTES"]),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
