import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ReportHistoryClient } from "@/features/reports/ReportHistoryClient";

export const dynamic = "force-dynamic";

async function getReports(studentId?: string) {
  return prisma.report.findMany({
    where: studentId ? { studentId } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      weekStart: true,
      weekEnd: true,
      subject: true,
      isSent: true,
      sentAt: true,
      createdAt: true,
      teacherKeywords: true,
      parentReportText: true,
      student: { select: { name: true, grade: true } },
    },
  });
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const { studentId } = await searchParams;
  const reports = await getReports(studentId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Report History</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {reports.length} report{reports.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/reports/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Report
        </Link>
      </div>
      <ReportHistoryClient
        reports={reports.map((r) => ({
          ...r,
          weekStart: r.weekStart.toISOString(),
          weekEnd: r.weekEnd.toISOString(),
          sentAt: r.sentAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

