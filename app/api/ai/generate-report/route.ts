import { generateReport, AIGenerationError, type ReportInput } from "@/lib/ai/report-generator";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response";
import { ZodError, z } from "zod";
import { sanitizeErrorForLog } from "@/lib/safe-log";

const schema = z.object({
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
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input: ReportInput = schema.parse(body);
    const result = await generateReport(input);
    return successResponse(result);
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
