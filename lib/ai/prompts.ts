import type { PreviousReportContext, ReportInput, ToneStyle } from "./types";

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

const TONE_STYLE_GUIDE: Record<ToneStyle, string> = {
  warm: "따뜻하고 배려 있는 어조. 학부모가 안심할 수 있는 정서적 표현을 적절히 포함",
  professional: "교사의 전문성이 드러나는 명확하고 단정한 어조. 과장 없이 사실 중심",
  encouraging: "학생의 노력을 적극적으로 인정하고 동기부여하는 어조",
  calm: "차분하고 절제된 어조. 감정 표현은 과하지 않게 안정적으로 전달",
  "growth-focused": "성장 과정과 개선 포인트를 균형 있게 강조하는 어조",
};

const BANNED_CLICHES = [
  "꾸준히 성장하고 있습니다",
  "성실하게 잘 따라오고 있습니다",
  "앞으로도 기대됩니다",
] as const;

export function buildParentSystemPrompt(toneStyle: ToneStyle, recentReports: PreviousReportContext[]): string {
  const recentSummary = recentReports.length === 0
    ? "최근 리포트 참고 데이터 없음"
    : recentReports
      .map((r, idx) => {
        const praise = r.frequentPraisePhrases?.join(", ") || "없음";
        return [
          `- 최근 ${idx + 1}주 toneStyle: ${r.toneStyle ?? "unknown"}`,
          `  시작 문장: ${r.openingSentence ?? "없음"}`,
          `  마무리 문장: ${r.closingSentence ?? "없음"}`,
          `  자주 쓴 칭찬 표현: ${praise}`,
        ].join("\n");
      })
      .join("\n");

  return `You are a professional Korean academy teacher writing a weekly report for a student's parent.

Primary objective:
- Keep facts and report structure stable.
- Change writing feel and phrasing week-to-week to avoid repetitive AI-like wording.

Tone style for this generation: ${toneStyle}
Style guide: ${TONE_STYLE_GUIDE[toneStyle]}

Hard rules (MUST follow):
- Write ENTIRELY in Korean.
- Keep 4-paragraph structure:
  1) greeting + this week's class summary
  2) homework/test facts
  3) attitude/understanding strengths & gaps
  4) encouragement + next-week preview + closing
- Keep factual details accurate from input. Do not invent scores or events.
- DO NOT reuse same opening sentence from recent reports.
- DO NOT reuse same closing sentence from recent reports.
- Minimize repeating praise phrases used recently.
- If one of the banned clichés appears in recent reports, avoid using it again.

Banned cliché phrases to avoid repeating:
${BANNED_CLICHES.map((p) => `- ${p}`).join("\n")}

Recent report references (last up to 3):
${recentSummary}`;
}

export const memoSystemPrompt = `You are an experienced academy teacher writing a concise internal weekly note for staff.

Rules:
- Write in English.
- Use very concise bullet points.
- Cover: topics covered, performance highlights, concerns, recommendation for next session.
- Total length: under 120 words.
- Be factual and specific. Avoid filler phrases.`;

export function buildParentReportPrompt(input: ReportInput): string {
  const lines: string[] = [
    `학생 이름: ${input.studentName}`,
    `과목: ${input.subject}`,
    `수업 기간: ${input.weekRange}`,
    "",
    `[이번 주 수업 내용]`,
    input.classContent,
    "",
    `[숙제 현황]`,
    `상태: ${HOMEWORK_LABELS[input.homeworkStatus] ?? input.homeworkStatus}`,
  ];

  if (input.homeworkNote) lines.push(`메모: ${input.homeworkNote}`);

  lines.push(
    "",
    `[수업 태도]: ${ATTITUDE_LABELS[input.attitude] ?? input.attitude}`,
    `[이해도]: ${UNDERSTANDING_LABELS[input.understanding] ?? input.understanding}`,
    `[출결]: ${ABSENCE_LABELS[input.absenceStatus] ?? input.absenceStatus}`,
    `[보충 수업]: ${MAKEUP_LABELS[input.makeupClassStatus] ?? input.makeupClassStatus}`,
  );

  if (input.testScore !== null && input.testScore !== undefined) {
    lines.push(`[시험 점수]: ${input.testScore}점 / 100점`);
  }

  if (input.nextPlan) lines.push("", `[다음 주 계획]`, input.nextPlan);

  if (input.teacherKeywords) {
    lines.push("", `[교사 메모 (리포트 톤에 반영할 키워드)]`, input.teacherKeywords);
  }

  return lines.join("\n");
}


export function buildParentRewriteSystemPrompt(toneStyle: ToneStyle, recentReports: PreviousReportContext[]): string {
  return `${buildParentSystemPrompt(toneStyle, recentReports)}

Rewrite-only mode rules:
- You will receive an already generated parent report text.
- Keep all facts, scores, and structure (4 paragraphs) the same.
- Rewrite wording and sentence flow only to reduce repetition.
- Do not shorten to fewer than 4 paragraphs.`;
}
export function buildMemoPrompt(input: ReportInput): string {
  const lines: string[] = [
    `Student: ${input.studentName} | Subject: ${input.subject} | Week: ${input.weekRange}`,
    `Class content: ${input.classContent}`,
    `Homework: ${input.homeworkStatus}${input.homeworkNote ? ` — ${input.homeworkNote}` : ""}`,
    `Attitude: ${input.attitude} | Understanding: ${input.understanding}`,
    `Attendance: ${input.absenceStatus} | Makeup: ${input.makeupClassStatus}`,
  ];

  if (input.testScore !== null && input.testScore !== undefined) lines.push(`Test score: ${input.testScore}/100`);
  if (input.nextPlan) lines.push(`Next week plan: ${input.nextPlan}`);
  if (input.teacherKeywords) lines.push(`Keywords: ${input.teacherKeywords}`);

  return lines.join("\n");
}
