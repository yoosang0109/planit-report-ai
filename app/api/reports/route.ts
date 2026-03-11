import { prisma } from "@/lib/prisma";
import { createReportSchema } from "@/lib/validations";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";
import { ZodError } from "zod";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    const reports = await prisma.report.findMany({
      where: studentId ? { studentId } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { name: true, subject: true, grade: true } },
        user: { select: { name: true } },
      },
    });
    return successResponse(reports);
  } catch {
    return errorResponse("Failed to fetch reports", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createReportSchema.parse(body);
    const report = await prisma.report.create({
      data: {
        ...data,
        weekStart: new Date(data.weekStart),
        weekEnd: new Date(data.weekEnd),
      },
      include: {
        student: { select: { name: true, subject: true, grade: true } },
      },
    });
    return successResponse(report, 201);
  } catch (err) {
    if (err instanceof ZodError) return validationErrorResponse(err);
    return errorResponse("Failed to create report", 500);
  }
}
