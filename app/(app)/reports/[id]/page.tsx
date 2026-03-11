import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ReportDetailClient } from "@/features/reports/ReportDetailClient";
import { gradeLabel } from "@/lib/display";

export const dynamic = "force-dynamic";

async function getReport(id: string) {
  return prisma.report.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, grade: true } },
    },
  });
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  const weekStart = report.weekStart.toISOString();
  const weekEnd = report.weekEnd.toISOString();
  const weekRange = `${new Date(weekStart).toLocaleDateString("ko-KR")} ~ ${new Date(weekEnd).toLocaleDateString("ko-KR")}`;

  return (
    <div>
      {/* Breadcrumb header */}
      <div className="mb-6">
        <Link
          href={`/students/${report.student.id}`}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {report.student.name}
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">
              Weekly Report
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {report.student.name} · {gradeLabel(report.student.grade)} · {weekRange}
            </p>
          </div>
          <Link href="/reports" className="btn-ghost text-sm">
            All Reports
          </Link>
        </div>
      </div>

      <ReportDetailClient
        report={{
          id: report.id,
          weekStart,
          weekEnd,
          subject: report.subject,
          classContent: report.classContent,
          homeworkStatus: report.homeworkStatus,
          attitude: report.attitude,
          understanding: report.understanding,
          absenceStatus: report.absenceStatus,
          teacherKeywords: report.teacherKeywords,
          parentReportText: report.parentReportText,
          internalMemoText: report.internalMemoText,
          isSent: report.isSent,
          sentAt: report.sentAt?.toISOString() ?? null,
          createdAt: report.createdAt.toISOString(),
          student: {
            id: report.student.id,
            name: report.student.name,
            grade: report.student.grade,
          },
        }}
      />
    </div>
  );
}
