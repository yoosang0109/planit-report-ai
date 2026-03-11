import { prisma } from "@/lib/prisma";
import { generateReportSchema } from "@/lib/validations";
import { generateParentReport, generateTeacherNotes } from "@/lib/openai";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = generateReportSchema.parse(body);

    // Fetch the student
    const student = await prisma.student.findUnique({
      where: { id: input.studentId },
    });
    if (!student) return errorResponse("Student not found", 404);

    // Gather report data
    let topicsCovered = input.topicsCovered ?? "";
    let progressNotes = input.progressNotes ?? "";
    let teacherObservations = input.teacherObservations ?? "";
    let weekStart = new Date().toISOString().split("T")[0];

    if (input.weeklyDataId) {
      const weeklyData = await prisma.weeklyData.findUnique({
        where: { id: input.weeklyDataId },
      });
      if (!weeklyData) return errorResponse("Weekly data not found", 404);

      topicsCovered = weeklyData.topicsCovered;
      progressNotes = weeklyData.progressNotes;
      teacherObservations = weeklyData.teacherObservations;
      weekStart = weeklyData.weekStart.toISOString().split("T")[0];
    }

    const reportData = {
      studentName: student.name,
      englishName: student.englishName,
      grade: student.grade,
      classGroup: student.classGroup,
      weekStart,
      topicsCovered,
      progressNotes,
      teacherObservations,
    };

    // Generate AI content
    let generatedContent: string;
    if (input.type === "PARENT_KOREAN") {
      generatedContent = await generateParentReport(reportData);
    } else {
      generatedContent = await generateTeacherNotes(reportData);
    }

    // Save to DB
    const report = await prisma.report.create({
      data: {
        studentId: input.studentId,
        weeklyDataId: input.weeklyDataId ?? null,
        type: input.type,
        generatedContent,
        editedContent: generatedContent, // starts same as generated
      },
      include: {
        student: { select: { name: true, englishName: true, grade: true, classGroup: true } },
      },
    });

    return successResponse(report, 201);
  } catch (err) {
    if (err instanceof ZodError) return validationErrorResponse(err);
    console.error("[generate report error]", err);
    return errorResponse("Failed to generate report", 500);
  }
}
