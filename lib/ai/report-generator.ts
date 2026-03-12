import OpenAI from "openai";
import type { ReportInput, ReportOutput } from "./types";
import {
  parentSystemPrompt,
  memoSystemPrompt,
  buildParentReportPrompt,
  buildMemoPrompt,
} from "./prompts";

export type { ReportInput, ReportOutput } from "./types";

export class AIGenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "AIGenerationError";
  }
}

export async function generateReport(input: ReportInput): Promise<ReportOutput> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const [parentResult, memoResult] = await Promise.all([
      openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.75,
        max_tokens: 900,
        messages: [
          { role: "system", content: parentSystemPrompt },
          {
            role: "user",
            content: `아래 정보를 바탕으로 학부모님께 보낼 주간 수업 보고서를 작성해 주세요.\n\n${buildParentReportPrompt(input)}`,
          },
        ],
      }),
      openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.5,
        max_tokens: 350,
        messages: [
          { role: "system", content: memoSystemPrompt },
          {
            role: "user",
            content: `Write the internal memo for:\n\n${buildMemoPrompt(input)}`,
          },
        ],
      }),
    ]);

    const parentReport = parentResult.choices[0]?.message?.content?.trim() ?? "";
    const internalMemo = memoResult.choices[0]?.message?.content?.trim() ?? "";

    if (!parentReport || !internalMemo) {
      throw new AIGenerationError("AI returned empty content.");
    }

    return { parentReport, internalMemo };
  } catch (err) {
    if (err instanceof AIGenerationError) throw err;
    throw new AIGenerationError(
      "AI generation failed. Please check your API key and try again.",
      err,
    );
  }
}
