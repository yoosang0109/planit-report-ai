import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

interface Params {
  params: { id: string };
}

export async function PATCH(_req: Request, { params }: Params) {
  try {
    const report = await prisma.report.findUnique({ where: { id: params.id } });
    if (!report) return errorResponse("Report not found", 404);

    const updated = await prisma.report.update({
      where: { id: params.id },
      data: {
        isSent: !report.isSent,
        sentAt: !report.isSent ? new Date() : null,
      },
    });
    return successResponse(updated);
  } catch {
    return errorResponse("Failed to toggle sent status", 500);
  }
}
