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

export interface ReportOutput {
  parentReport: string;
  internalMemo: string;
}
