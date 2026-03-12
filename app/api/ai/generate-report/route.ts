import {
  generateReport,
  rewriteParentReportExpressions,
  AIGenerationError,
  type ReportInput,
  type PreviousReportContext,
  type ToneStyle,
} from "@/lib/ai/report-generator";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";
import { ZodError, z } from "zod";
import { sanitizeErrorForLog } from "@/lib/safe-log";
import { prisma } from "@/lib/prisma";
import { checkParentReportDuplication } from "@/lib/ai/duplication-check";

const toneStyleSchema = z.enum(["warm", "professional", "encouraging", "calm", "growth-focused"]);

const schema = z.object({
  mode: z.enum(["generate", "rewrite"]).optional().default("generate"),
  studentId: z.string().min(1).optional(),
  studentName: z.string().min(1),
  subject: z.string().min(1),
  weekRange: z.string().min(1),
  classContent: z.string().min(1),
  homeworkStatus: z.enum(["COMPLETE", "INCOMPLETE", "PARTIAL", "NOT_ASSIGNED"]),
  homeworkNote: z.string().optional(),
  testScore: z.number().int().min(0).max(100).nullable().optional(),
  attitude: z.enum(["EXCELLENT", "GOOD", "AVERAGE", "NEEDS_IMPROVEMENT"]),
  understanding: z.enum(["EXCELLENT", "GOOD", "AVERAGE", "NEEDS_IMPROVEMENT"]),
  absenceStatus: z.enum(["PRESENT", "ABSENT", "LATE"]),
  makeupClassStatus: z.enum(["NOT_NEEDED", "SCHEDULED", "COMPLETED", "SKIPPED"]),
  nextPlan: z.string().optional(),
  teacherKeywords: z.string().optional(),
  preferredToneStyle: toneStyleSchema.optional(),
  existingParentReport: z.string().optional(),
  existingInternalMemo: z.string().optional(),
  currentToneStyle: toneStyleSchema.optional(),
});

function extractSentence(text: string | null | undefined, which: "first" | "last"): string | null {
  if (!text) return null;
  const sentences = text
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return null;
  return which === "first" ? sentences[0] : sentences[sentences.length - 1];
}

const PRAISE_PATTERNS = ["칭찬", "노력", "성장", "참여", "태도", "우수", "훌륭"];

function extractPraiseHints(text: string | null | undefined): string[] {
  if (!text) return [];
  return PRAISE_PATTERNS.filter((word) => text.includes(word));
}

async function loadRecentReports(studentId?: string): Promise<PreviousReportContext[]> {
  if (!studentId) return [];

  const reports = await prisma.report.findMany({
    where: { studentId, parentReportText: { not: null } },
    orderBy: { weekStart: "desc" },
    take: 3,
    select: {
      toneStyle: true,
      parentReportText: true,
    },
  });

  return reports.map((report) => ({
    toneStyle: report.toneStyle,
    openingSentence: extractSentence(report.parentReportText, "first"),
    closingSentence: extractSentence(report.parentReportText, "last"),
    frequentPraisePhrases: extractPraiseHints(report.parentReportText),
  }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const recentReports = await loadRecentReports(parsed.studentId);

    if (parsed.mode === "rewrite") {
      if (!parsed.existingParentReport) return errorResponse("existingParentReport is required for rewrite mode", 400);
      const toneStyle = (parsed.currentToneStyle ?? parsed.preferredToneStyle ?? "warm") as ToneStyle;
      const rewrittenParent = await rewriteParentReportExpressions(parsed.existingParentReport, recentReports, toneStyle);
      const duplicationCheck = checkParentReportDuplication(rewrittenParent, recentReports);

      return successResponse({
        parentReport: rewrittenParent,
        internalMemo: parsed.existingInternalMemo ?? "",
        toneStyle,
        duplicationCheck,
        mode: "rewrite",
      });
    }

    const input: ReportInput = {
      studentName: parsed.studentName,
      subject: parsed.subject,
      weekRange: parsed.weekRange,
      classContent: parsed.classContent,
      homeworkStatus: parsed.homeworkStatus,
      homeworkNote: parsed.homeworkNote,
      testScore: parsed.testScore,
      attitude: parsed.attitude,
      understanding: parsed.understanding,
      absenceStatus: parsed.absenceStatus,
      makeupClassStatus: parsed.makeupClassStatus,
      nextPlan: parsed.nextPlan,
      teacherKeywords: parsed.teacherKeywords,
    };

    const result = await generateReport(input, {
      preferredToneStyle: parsed.preferredToneStyle,
      recentReports,
    });

    const duplicationCheck = checkParentReportDuplication(result.parentReport, recentReports);

    return successResponse({
      ...result,
      duplicationCheck,
      mode: "generate",
    });
  } catch (err) {
    if (err instanceof ZodError) return validationErrorResponse(err);
    if (err instanceof AIGenerationError) {
      console.error("[ai/generate-report] AI error:", sanitizeErrorForLog(err.cause ?? err.message));
      return errorResponse(err.message, 502);
    }
    console.error("[ai/generate-report] Unexpected error:", sanitizeErrorForLog(err));
    return errorResponse("Internal server error", 500);
  }
}
