import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ReportData {
  studentName: string;
  englishName: string;
  grade: string;
  classGroup: string;
  weekStart: string;
  topicsCovered: string;
  progressNotes: string;
  teacherObservations: string;
}

export async function generateParentReport(data: ReportData): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a professional English academy teacher in Korea writing a warm, formal weekly report for a Korean parent. 
Write the report entirely in Korean (한국어). 
The tone should be respectful, encouraging, and informative.
Do NOT use bullet points — write in flowing, natural Korean prose.
Keep it to 3–4 paragraphs: greeting/intro, this week's learning, student's performance & attitude, closing/encouragement.`,
      },
      {
        role: "user",
        content: `Please write the weekly Korean parent report for:

학생 이름 (Korean Name): ${data.studentName}
학생 영어 이름 (English Name): ${data.englishName}
학년 (Grade): ${data.grade}
수업 그룹 (Class): ${data.classGroup}
주간 시작일 (Week of): ${data.weekStart}

이번 주 학습 내용 (Topics Covered):
${data.topicsCovered}

학습 진도 및 이해도 (Progress Notes):
${data.progressNotes}

교사 관찰 사항 (Teacher Observations):
${data.teacherObservations}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 800,
  });

  return completion.choices[0]?.message?.content ?? "";
}

export async function generateTeacherNotes(data: ReportData): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an experienced English academy teacher writing concise, professional internal notes for a colleague or director.
Write in English. Be factual, practical, and use educator terminology.
Format: Brief bullet points covering: Topics covered, Student performance, Concerns or highlights, Recommendations for next session.
Keep it concise — under 200 words.`,
      },
      {
        role: "user",
        content: `Write internal teacher notes for:

Student: ${data.englishName} (${data.studentName})
Grade: ${data.grade} | Class: ${data.classGroup}
Week of: ${data.weekStart}

Topics Covered: ${data.topicsCovered}
Progress Notes: ${data.progressNotes}
Observations: ${data.teacherObservations}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 400,
  });

  return completion.choices[0]?.message?.content ?? "";
}
