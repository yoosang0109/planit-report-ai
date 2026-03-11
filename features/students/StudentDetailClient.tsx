"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { gradeLabel, levelLabel, toneLabel } from "@/lib/display";

interface Report {
  id: string;
  isSent: boolean;
  createdAt: string;
  weekStart: string;
  parentReportText: string | null;
  internalMemoText: string | null;
}

interface StudentProps {
  id: string;
  name: string;
  subject: string;
  grade: string;
  level: string;
  school: string | null;
  parentName: string | null;
  parentPhone: string | null;
  defaultTone: string;
  notes: string | null;
  isActive: boolean;
  reportCount: number;
  reports: Report[];
}

export function StudentDetailClient({ student }: { student: StudentProps }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete ${student.name}? This will remove all associated reports.`)) return;
    setDeleting(true);
    await fetch(`/api/students/${student.id}`, { method: "DELETE" });
    router.push("/students");
    router.refresh();
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Main content */}
      <div className="col-span-2 space-y-5">
        {/* Notes */}
        {student.notes && (
          <div className="card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Internal Notes
            </h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {student.notes}
            </p>
          </div>
        )}

        {/* Recent reports */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
            <h3 className="text-sm font-semibold text-slate-700">
              Reports ({student.reportCount})
            </h3>
            <Link
              href={`/reports?studentId=${student.id}`}
              className="text-xs text-brand-600 hover:underline"
            >
              View all →
            </Link>
          </div>

          {student.reports.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-slate-500 mb-3">No reports yet.</p>
              <Link
                href={`/reports/new?studentId=${student.id}`}
                className="btn-primary text-sm"
              >
                Generate first report
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-surface-100">
              {student.reports.map((report) => (
                <li key={report.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <span className="text-xs text-slate-500">
                      Week of {new Date(report.weekStart).toLocaleDateString("ko-KR")}
                    </span>
                    <div className="flex gap-1.5 mt-0.5">
                      {report.parentReportText && (
                        <span className="badge badge-blue">Parent</span>
                      )}
                      {report.internalMemoText && (
                        <span className="badge badge-gray">Teacher Notes</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.isSent && (
                      <span className="badge-green">✓ Sent</span>
                    )}
                    <Link
                      href={`/reports/${report.id}`}
                      className="btn-ghost py-1 px-2 text-xs"
                    >
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Student details */}
        <div className="card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            Details
          </h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-slate-400">Subject</dt>
              <dd className="font-medium text-slate-700">{student.subject}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Grade</dt>
              <dd className="text-slate-700">{gradeLabel(student.grade)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Level</dt>
              <dd className="text-slate-700">{levelLabel(student.level)}</dd>
            </div>
            {student.school && (
              <div>
                <dt className="text-xs text-slate-400">School</dt>
                <dd className="text-slate-700">{student.school}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-slate-400">Default Tone</dt>
              <dd className="text-slate-700">{toneLabel(student.defaultTone)}</dd>
            </div>
          </dl>
        </div>

        {/* Parent contact */}
        {(student.parentName || student.parentPhone) && (
          <div className="card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Parent Contact
            </h3>
            <dl className="space-y-2 text-sm">
              {student.parentName && (
                <div>
                  <dt className="text-xs text-slate-400">Name</dt>
                  <dd className="text-slate-700">{student.parentName}</dd>
                </div>
              )}
              {student.parentPhone && (
                <div>
                  <dt className="text-xs text-slate-400">Phone</dt>
                  <dd className="font-mono text-slate-700">{student.parentPhone}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Actions */}
        <div className="card p-5 space-y-2">
          <Link
            href={`/students/${student.id}/edit`}
            className="btn-secondary w-full justify-center"
          >
            Edit Student
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger w-full justify-center"
          >
            {deleting ? "Deleting..." : "Delete Student"}
          </button>
        </div>
      </div>
    </div>
  );
}
