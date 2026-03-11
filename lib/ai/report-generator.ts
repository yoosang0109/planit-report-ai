import OpenAI from "openai";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportInput {
  studentName: string;
  subject: string;
  weekRange: string;        // e.g. "2026-03-09 ~ 2026-03-13"
  classContent: string;
  homeworkStatus: string;   // COMPLETE | INCOMPLETE | PARTIAL | NOT_ASSIGNED
  homeworkNote?: string;
  testScore?: number | null;
  attitude: string;         // EXCELLENT | GOOD | AVERAGE | NEEDS_IMPROVEMENT
  understanding: string;    // same enum
  absenceStatus: string;    // PRESENT | ABSENT | LATE
  makeupClassStatus: string; // NOT_NEEDED | SCHEDULED | COMPLETED | SKIPPED
  nextPlan?: string;
  teacherKeywords?: string; // comma-separated hints
}

export interface ReportOutput {
  parentReport: string;
  internalMemo: string;
}

// ---------------------------------------------------------------------------
// Typed error so API layer can map to a specific HTTP status
// ---------------------------------------------------------------------------

export class AIGenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "AIGenerationError";
  }
}

// ---------------------------------------------------------------------------
// Label helpers (keep server-side, no import from client validations)
// ---------------------------------------------------------------------------

const HOMEWORK_LABELS: Record<string, string> = {
  COMPLETE: "완료",
  INCOMPLETE: "미완료",
  PARTIAL: "부분 완료",
  NOT_ASSIGNED: "미부여",
};

const ATTITUDE_LABELS: Record<string, string> = {
  EXCELLENT: "매우 우수",
  GOOD: "양호",
  AVERAGE: "보통",
  NEEDS_IMPROVEMENT: "개선 필요",
};

const UNDERSTANDING_LABELS: Record<string, string> = {
  EXCELLENT: "매우 우수",
  GOOD: "양호",
  AVERAGE: "보통",
  NEEDS_IMPROVEMENT: "개선 필요",
};

const ABSENCE_LABELS: Record<string, string> = {
  PRESENT: "출석",
  ABSENT: "결석",
  LATE: "지각",
};

const MAKEUP_LABELS: Record<string, string> = {
  NOT_NEEDED: "불필요",
  SCHEDULED: "예정됨",
  COMPLETED: "완료",
  SKIPPED: "진행 안 함",
};

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function buildParentReportPrompt(input: ReportInput): string {
  const lines: string[] = [
    `학생 이름: ${input.studentName}`,
    `과목: ${input.subject}`,
    `수업 기간: ${input.weekRange}`,
    ``,
    `[이번 주 수업 내용]`,
    input.classContent,
    ``,
    `[숙제 현황]`,
    `상태: ${HOMEWORK_LABELS[input.homeworkStatus] ?? input.homeworkStatus}`,
  ];

  if (input.homeworkNote) {
    lines.push(`메모: ${input.homeworkNote}`);
  }

  lines.push(
    ``,
    `[수업 태도]: ${ATTITUDE_LABELS[input.attitude] ?? input.attitude}`,
    `[이해도]: ${UNDERSTANDING_LABELS[input.understanding] ?? input.understanding}`,
    `[출결]: ${ABSENCE_LABELS[input.absenceStatus] ?? input.absenceStatus}`,
    `[보충 수업]: ${MAKEUP_LABELS[input.makeupClassStatus] ?? input.makeupClassStatus}`,
  );

  if (input.testScore !== null && input.testScore !== undefined) {
    lines.push(`[시험 점수]: ${input.testScore}점 / 100점`);
  }

  if (input.nextPlan) {
    lines.push(``, `[다음 주 계획]`, input.nextPlan);
  }

  if (input.teacherKeywords) {
    lines.push(
      ``,
      `[교사 메모 (리포트 톤에 반영할 키워드)]`,
      input.teacherKeywords,
    );
  }

  return lines.join("\n");
}

function buildMemoPrompt(input: ReportInput): string {
  const lines: string[] = [
    `Student: ${input.studentName} | Subject: ${input.subject} | Week: ${input.weekRange}`,
    `Class content: ${input.classContent}`,
    `Homework: ${input.homeworkStatus}${input.homeworkNote ? ` — ${input.homeworkNote}` : ""}`,
    `Attitude: ${input.attitude} | Understanding: ${input.understanding}`,
    `Attendance: ${input.absenceStatus} | Makeup: ${input.makeupClassStatus}`,
  ];

  if (input.testScore !== null && input.testScore !== undefined) {
    lines.push(`Test score: ${input.testScore}/100`);
  }
  if (input.nextPlan) lines.push(`Next week plan: ${input.nextPlan}`);
  if (input.teacherKeywords) lines.push(`Keywords: ${input.teacherKeywords}`);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main generation function — provider-agnostic boundary is this function.
// To swap providers, replace the implementation here without touching callers.
// ---------------------------------------------------------------------------

export async function generateReport(input: ReportInput): Promise<ReportOutput> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const parentSystemPrompt = `You are a professional Korean language academy teacher writing a weekly report for a student's parent.

Rules (MUST follow):
- Write ENTIRELY in Korean (한국어). Do NOT use English.
- Prose style only. NO bullet points, NO numbered lists, NO headers.
- 3 to 4 paragraphs: (1) greeting + this week's class summary, (2) homework and test results, (3) attitude, understanding, strengths/weaknesses, (4) encouragement + next week preview and closing.
- Tone: warm, professional, trustworthy. NOT robotic. NOT excessively flattering.
- Reflect any teacher keywords naturally into the tone — do NOT copy them verbatim.
- Length: 250 ~ 400 Korean characters per paragraph. Total 4 paragraphs.`;

  const memoSystemPrompt = `You are an experienced academy teacher writing a concise internal weekly note for staff.

Rules:
- Write in English.
- Use very concise bullet points.
- Cover: topics covered, performance highlights, concerns, recommendation for next session.
- Total length: under 120 words.
- Be factual and specific. Avoid filler phrases.`;

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
    // Wrap OpenAI / network errors
    throw new AIGenerationError(
      "AI generation failed. Please check your API key and try again.",
      err,
    );
  }
}
