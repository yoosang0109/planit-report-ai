import { prisma } from "@/lib/prisma";
import { NewReportClient } from "@/features/reports/NewReportClient";

export const dynamic = "force-dynamic";

async function getStudents() {
  return prisma.student.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      grade: true,
      subject: true,
      level: true,
      parentName: true,
      defaultTone: true,
    },
  });
}

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const { studentId } = await searchParams;
  const students = await getStudents();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">New Weekly Report</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Fill in the weekly details, then generate and edit the parent report and internal memo.
        </p>
      </div>
      <NewReportClient students={students} preselectedStudentId={studentId} />
    </div>
  );
}
