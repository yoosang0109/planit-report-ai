import { errorResponse } from "@/lib/api-response";

// Weekly data has been removed in the updated schema.
// Reports now carry all per-session data directly.
export async function GET() {
  return errorResponse("This endpoint has been removed. Use /api/reports instead.", 410);
}

export async function POST() {
  return errorResponse("This endpoint has been removed. Use /api/reports instead.", 410);
}
