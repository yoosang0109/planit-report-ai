import { prisma } from "@/lib/prisma";
import { createStudentSchema } from "@/lib/validations";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";
import { ZodError } from "zod";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const students = await prisma.student.findMany({
      where: {
        isActive: activeOnly ? true : undefined,
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { subject: { contains: search } },
                { school: { contains: search } },
                { parentName: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { reports: true } },
      },
    });
    return successResponse(students);
  } catch {
    return errorResponse("Failed to fetch students", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createStudentSchema.parse(body);
    const student = await prisma.student.create({ data });
    return successResponse(student, 201);
  } catch (err) {
    if (err instanceof ZodError) return validationErrorResponse(err);
    return errorResponse("Failed to create student", 500);
  }
}
