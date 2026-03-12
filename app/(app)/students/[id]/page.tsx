import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StudentDetailClient } from "@/features/students/StudentDetailClient";
import { gradeLabel, levelLabel, toneLabel, LEVEL_COLORS } from "@/lib/display";

export const dynamic = "force-dynamic";

async function getStudent(id: string) {
  return prisma.student.findUnique({
    where: { id },
    include: {
      reports: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { reports: true } },
    },
  });
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const student = await getStudent(params.id);
  if (!student) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/students"
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Students
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-slate-800">{student.name}</h1>
              {!student.isActive && (
                <span className="badge badge-gray text-xs">Inactive</span>
              )}
              <span className={`badge text-xs ${LEVEL_COLORS[student.level] ?? "badge-gray"}`}>
                {levelLabel(student.level)}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {student.subject} · {gradeLabel(student.grade)}
              {student.school && ` · ${student.school}`}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/reports/new?studentId=${student.id}`}
              className="btn-primary"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Report
            </Link>
            <Link href={`/students/${student.id}/edit`} className="btn-secondary">
              Edit
            </Link>
          </div>
        </div>
      </div>

      <StudentDetailClient
        student={{
          id: student.id,
          name: student.name,
          subject: student.subject,
          grade: student.grade,
          level: student.level,
          school: student.school,
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          defaultTone: student.defaultTone,
          notes: student.notes,
          isActive: student.isActive,
          reportCount: student._count.reports,
          reports: student.reports.map((r) => ({
            id: r.id,
            isSent: r.isSent,
            createdAt: r.createdAt.toISOString(),
            weekStart: r.weekStart.toISOString(),
            parentReportText: r.parentReportText,
            internalMemoText: r.internalMemoText,
          })),
        }}
      />
    </div>
  );
}
