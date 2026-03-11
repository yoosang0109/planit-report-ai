import { prisma } from "@/lib/prisma";
import { updateStudentSchema } from "@/lib/validations";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";
import { ZodError } from "zod";

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        reports: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: { select: { name: true } },
          },
        },
        _count: { select: { reports: true } },
      },
    });
    if (!student) return errorResponse("Student not found", 404);
    return successResponse(student);
  } catch {
    return errorResponse("Failed to fetch student", 500);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const body = await request.json();
    const data = updateStudentSchema.parse(body);
    const student = await prisma.student.update({
      where: { id: params.id },
      data,
    });
    return successResponse(student);
  } catch (err) {
    if (err instanceof ZodError) return validationErrorResponse(err);
    return errorResponse("Failed to update student", 500);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.student.delete({ where: { id: params.id } });
    return successResponse({ deleted: true });
  } catch {
    return errorResponse("Failed to delete student", 500);
  }
}
