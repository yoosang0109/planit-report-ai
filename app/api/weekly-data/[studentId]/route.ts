import { errorResponse } from "@/lib/api-response";

export async function GET() {
  return errorResponse("This endpoint has been removed. Use /api/reports instead.", 410);
}
