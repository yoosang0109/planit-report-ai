import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // --- Default admin user --------------------------------------------------
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

  // --- Students ------------------------------------------------------------
  const studentsData = [
    {
      name: "김민준",
      grade: "ELEM_5",
      school: "서울초등학교",
      subject: "영어",
      level: "INTERMEDIATE",
      parentName: "김지수",
      parentPhone: "010-1234-5678",
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
      parentPhone: "010-2345-6789",
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
      parentPhone: "010-3456-7890",
      defaultTone: "ENCOURAGING",
      notes: "자신감 부족. 긍정적 피드백 강조.",
      isActive: true,
    },
    {
      name: "최하은",
      grade: "MIDDLE_2",
      school: "연세중학교",
      subject: "영어",
      level: "ELEMENTARY",
      parentName: "최은지",
      parentPhone: "010-4567-8901",
      defaultTone: "DETAILED",
      notes: "스펠링 반복 실수. 추가 어휘 연습 권장.",
      isActive: true,
    },
    {
      name: "정우진",
      grade: "HIGH_1",
      school: "서강고등학교",
      subject: "영어",
      level: "INTERMEDIATE",
      parentName: "정현수",
      parentPhone: "010-5678-9012",
      defaultTone: "FORMAL",
      notes: "수능 준비 중점. 독해 강화.",
      isActive: true,
    },
  ];

  for (const data of studentsData) {
    const existing = await prisma.student.findFirst({ where: { name: data.name } });
    const student = await prisma.student.upsert({
      where: { id: existing?.id ?? "not-found" },
      update: {},
      create: data,
    });
    console.log(`✓ Student: ${student.name}`);
  }

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
