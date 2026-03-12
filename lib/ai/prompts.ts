import type { ReportInput } from "./types";

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

export const parentSystemPrompt = `You are a professional Korean language academy teacher writing a weekly report for a student's parent.

Rules (MUST follow):
- Write ENTIRELY in Korean (한국어). Do NOT use English.
- Prose style only. NO bullet points, NO numbered lists, NO headers.
- 3 to 4 paragraphs: (1) greeting + this week's class summary, (2) homework and test results, (3) attitude, understanding, strengths/weaknesses, (4) encouragement + next week preview and closing.
- Tone: warm, professional, trustworthy. NOT robotic. NOT excessively flattering.
- Reflect any teacher keywords naturally into the tone — do NOT copy them verbatim.
- Length: 250 ~ 400 Korean characters per paragraph. Total 4 paragraphs.`;

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
