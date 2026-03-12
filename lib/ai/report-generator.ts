import OpenAI from "openai";
import type { PreviousReportContext, ReportInput, ReportOutput, ToneStyle } from "./types";
import { TONE_STYLES } from "./types";
import {
  buildParentSystemPrompt,
  memoSystemPrompt,
  buildParentReportPrompt,
  buildMemoPrompt,
} from "./prompts";

export type { ReportInput, ReportOutput, PreviousReportContext, ToneStyle } from "./types";

export class AIGenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "AIGenerationError";
  }
}

export interface GenerateReportOptions {
  preferredToneStyle?: ToneStyle;
  recentReports?: PreviousReportContext[];
}

export function selectToneStyle(recentReports: PreviousReportContext[], preferredToneStyle?: ToneStyle): ToneStyle {
  if (preferredToneStyle) return preferredToneStyle;

  const recentStyles = recentReports
    .map((r) => r.toneStyle)
    .filter((s): s is ToneStyle => TONE_STYLES.includes(s as ToneStyle));

  const candidates = TONE_STYLES.filter((style) => !recentStyles.slice(0, 2).includes(style));
  if (candidates.length > 0) {
    return candidates[0];
  }

  const fallbackIndex = recentStyles.length % TONE_STYLES.length;
  return TONE_STYLES[fallbackIndex] ?? "warm";
}

export async function generateReport(input: ReportInput, options?: GenerateReportOptions): Promise<ReportOutput> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const recentReports = options?.recentReports ?? [];
  const toneStyle = selectToneStyle(recentReports, options?.preferredToneStyle);

  try {
    const [parentResult, memoResult] = await Promise.all([
      openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.82,
        max_tokens: 900,
        messages: [
          { role: "system", content: buildParentSystemPrompt(toneStyle, recentReports) },
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

    return { parentReport, internalMemo, toneStyle };
  } catch (err) {
    if (err instanceof AIGenerationError) throw err;
    throw new AIGenerationError(
      "AI generation failed. Please check your API key and try again.",
      err,
    );
  }
}
