import { prisma } from "@/lib/prisma";
import { updateReportSchema } from "@/lib/validations";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";
import { ZodError } from "zod";

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        student: true,
        user: { select: { name: true } },
      },
    });
    if (!report) return errorResponse("Report not found", 404);
    return successResponse(report);
  } catch {
    return errorResponse("Failed to fetch report", 500);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const body = await request.json();
    const data = updateReportSchema.parse(body);
    const report = await prisma.report.update({
      where: { id: params.id },
      data,
    });
    return successResponse(report);
  } catch (err) {
    if (err instanceof ZodError) return validationErrorResponse(err);
    return errorResponse("Failed to update report", 500);
  }
}
