import { prisma } from "@/lib/prisma";
import { generateReportSchema } from "@/lib/validations";
import { generateReport, AIGenerationError, type PreviousReportContext, type ReportInput } from "@/lib/ai/report-generator";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";
import { ZodError } from "zod";
import { sanitizeErrorForLog } from "@/lib/safe-log";

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

async function loadRecentReports(studentId: string, excludeReportId: string): Promise<PreviousReportContext[]> {
  const reports = await prisma.report.findMany({
    where: {
      studentId,
      id: { not: excludeReportId },
      parentReportText: { not: null },
    },
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
    const input = generateReportSchema.parse(body);

    const report = await prisma.report.findUnique({
      where: { id: input.reportId },
      include: {
        student: {
          select: {
            name: true,
            subject: true,
          },
        },
      },
    });

    if (!report) return errorResponse("Report not found", 404);

    const aiInput: ReportInput = {
      studentName: report.student.name,
      subject: report.subject || report.student.subject,
      weekRange: `${report.weekStart.toISOString().slice(0, 10)} ~ ${report.weekEnd.toISOString().slice(0, 10)}`,
      classContent: report.classContent,
      homeworkStatus: report.homeworkStatus,
      homeworkNote: report.homeworkNote ?? undefined,
      testScore: report.testScore,
      attitude: report.attitude,
      understanding: report.understanding,
      absenceStatus: report.absenceStatus,
      makeupClassStatus: report.makeupClassStatus,
      nextPlan: report.nextPlan ?? undefined,
      teacherKeywords: report.teacherKeywords ?? undefined,
    };

    const recentReports = await loadRecentReports(report.studentId, report.id);

    const generated = await generateReport(aiInput, {
      preferredToneStyle: input.preferredToneStyle,
      recentReports,
    });

    const updated = await prisma.report.update({
      where: { id: report.id },
      data: {
        parentReportText: generated.parentReport,
        internalMemoText: generated.internalMemo,
        toneStyle: generated.toneStyle,
      },
    });

    return successResponse(
      {
        report: updated,
        generated: input.type === "PARENT_KOREAN"
          ? { parentReportText: generated.parentReport, toneStyle: generated.toneStyle }
          : { internalMemoText: generated.internalMemo, toneStyle: generated.toneStyle },
      },
      200,
    );
  } catch (err) {
    if (err instanceof ZodError) return validationErrorResponse(err);
    if (err instanceof AIGenerationError) return errorResponse(err.message, 502);

    console.error("[reports/generate]", sanitizeErrorForLog(err));
    return errorResponse("Failed to generate report", 500);
  }
}
