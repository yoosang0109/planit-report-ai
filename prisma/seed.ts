import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertStudentByName(data: {
  name: string;
  grade: string;
  school: string;
  subject: string;
  level: string;
  parentName: string;
  parentPhone: string;
  defaultTone: string;
  notes: string;
  isActive: boolean;
}) {
  const existing = await prisma.student.findFirst({ where: { name: data.name } });

  if (existing) {
    return prisma.student.update({ where: { id: existing.id }, data });
  }

  return prisma.student.create({ data });
}

async function main() {
  console.log("🌱 Seeding database...");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@planit.academy" },
    update: {},
    create: {
      name: "Admin Teacher",
      email: "admin@planit.academy",
      passwordHash: "$2b$10$placeholder_hash_change_in_production",
      role: "DIRECTOR",
    },
  });

  console.log(`✓ User: ${adminUser.name}`);

  // NOTE: below values are demo-only fake data (no real PII)
  const studentsData = [
    {
      name: "김민준",
      grade: "ELEM_5",
      school: "서울초등학교",
      subject: "영어",
      level: "INTERMEDIATE",
      parentName: "김지수",
      parentPhone: "010-0000-0001",
      defaultTone: "FRIENDLY",
      notes: "발음 교정 집중 필요. 수업 참여도 높음.",
      isActive: true,
    },
    {
      name: "이서윤",
      grade: "MIDDLE_1",
      school: "한강중학교",
      subject: "영어",
      level: "UPPER_INTERMEDIATE",
      parentName: "이미경",
      parentPhone: "010-0000-0002",
      defaultTone: "FORMAL",
      notes: "문법 우수, 작문 연습 강화 필요.",
      isActive: true,
    },
    {
      name: "박지호",
      grade: "ELEM_6",
      school: "강남초등학교",
      subject: "수학",
      level: "ADVANCED",
      parentName: "박성진",
      parentPhone: "010-0000-0003",
      defaultTone: "ENCOURAGING",
      notes: "자신감 부족. 긍정적 피드백 강조.",
      isActive: true,
    },
  ];

  const students = [];
  for (const data of studentsData) {
    const student = await upsertStudentByName(data);
    students.push(student);
    console.log(`✓ Student: ${student.name}`);
  }

  const reportTemplates = [
    {
      studentIndex: 0,
      weekStart: new Date("2026-03-09T00:00:00.000Z"),
      weekEnd: new Date("2026-03-13T23:59:59.000Z"),
      classContent: "과거시제 복습, 독해 지문 2개, 핵심 단어 테스트",
      homeworkStatus: "COMPLETE",
      homeworkNote: "단어장 2회 반복 완료",
      testScore: 88,
      attitude: "GOOD",
      understanding: "AVERAGE",
      absenceStatus: "PRESENT",
      makeupClassStatus: "NOT_NEEDED",
      nextPlan: "다음 주에는 문장 확장 작문을 집중 훈련합니다.",
      teacherKeywords: "친절한 톤, 성장 중심 피드백",
      parentReportText: "이번 주에는 과거시제와 독해를 중심으로 안정적으로 학습했습니다.",
      internalMemoText: "- Tense review solid\n- Needs more writing drills",
      toneStyle: "warm",
    },
    {
      studentIndex: 1,
      weekStart: new Date("2026-03-09T00:00:00.000Z"),
      weekEnd: new Date("2026-03-13T23:59:59.000Z"),
      classContent: "문법 심화(관계대명사), 중등 독해 지문 분석",
      homeworkStatus: "PARTIAL",
      homeworkNote: "서술형 2문항 미완료",
      testScore: 76,
      attitude: "GOOD",
      understanding: "GOOD",
      absenceStatus: "PRESENT",
      makeupClassStatus: "NOT_NEEDED",
      nextPlan: "서술형 답안 구조 연습을 강화합니다.",
      teacherKeywords: "구체적, 차분한",
      parentReportText: "문법 이해도는 양호하며, 서술형 완성도를 높이는 단계입니다.",
      internalMemoText: "- Strong grammar base\n- Follow up on written responses",
      toneStyle: "professional",
    },
  ];

  for (const template of reportTemplates) {
    const student = students[template.studentIndex];
    if (!student) continue;

    const exists = await prisma.report.findFirst({
      where: {
        studentId: student.id,
        weekStart: template.weekStart,
      },
    });

    if (exists) continue;

    await prisma.report.create({
      data: {
        studentId: student.id,
        userId: adminUser.id,
        subject: student.subject,
        weekStart: template.weekStart,
        weekEnd: template.weekEnd,
        classContent: template.classContent,
        homeworkStatus: template.homeworkStatus,
        homeworkNote: template.homeworkNote,
        testScore: template.testScore,
        attitude: template.attitude,
        understanding: template.understanding,
        absenceStatus: template.absenceStatus,
        makeupClassStatus: template.makeupClassStatus,
        nextPlan: template.nextPlan,
        teacherKeywords: template.teacherKeywords,
        parentReportText: template.parentReportText,
        internalMemoText: template.internalMemoText,
        toneStyle: template.toneStyle,
      },
    });
  }

  console.log("✓ Demo reports seeded");
  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
