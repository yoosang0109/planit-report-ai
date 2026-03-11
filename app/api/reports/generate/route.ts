import { prisma } from "@/lib/prisma";
import { generateReportSchema } from "@/lib/validations";
import { generateReport, AIGenerationError, type ReportInput } from "@/lib/ai/report-generator";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";
import { ZodError } from "zod";

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

    const generated = await generateReport(aiInput);

    const updated = await prisma.report.update({
      where: { id: report.id },
      data: {
        parentReportText: generated.parentReport,
        internalMemoText: generated.internalMemo,
      },
    });

    return successResponse(
      {
        report: updated,
        generated: input.type === "PARENT_KOREAN"
          ? { parentReportText: generated.parentReport }
          : { internalMemoText: generated.internalMemo },
      },
      200,
    );
  } catch (err) {
    if (err instanceof ZodError) return validationErrorResponse(err);
    if (err instanceof AIGenerationError) return errorResponse(err.message, 502);

    console.error("[reports/generate]", err);
    return errorResponse("Failed to generate report", 500);
  }
}
