export const TONE_STYLES = ["warm", "professional", "encouraging", "calm", "growth-focused"] as const;

export type ToneStyle = (typeof TONE_STYLES)[number];

export interface ReportInput {
  studentName: string;
  subject: string;
  weekRange: string;
  classContent: string;
  homeworkStatus: string;
  homeworkNote?: string;
  testScore?: number | null;
  attitude: string;
  understanding: string;
  absenceStatus: string;
  makeupClassStatus: string;
  nextPlan?: string;
  teacherKeywords?: string;
}

export interface PreviousReportContext {
  toneStyle?: string | null;
  openingSentence?: string | null;
  closingSentence?: string | null;
  frequentPraisePhrases?: string[];
}

export interface ReportOutput {
  parentReport: string;
  internalMemo: string;
  toneStyle: ToneStyle;
}
