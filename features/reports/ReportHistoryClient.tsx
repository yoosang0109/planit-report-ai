"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "@/components/Toast";
import { gradeLabel } from "@/lib/display";

export interface HistoryReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  subject: string;
  isSent: boolean;
  sentAt: string | null;
  createdAt: string;
  teacherKeywords: string | null;
  parentReportText: string | null;
  student: { name: string; grade: string };
}

export function ReportHistoryClient({ reports }: { reports: HistoryReport[] }) {
  const [sentMap, setSentMap] = useState<Record<string, boolean>>(
    Object.fromEntries(reports.map((r) => [r.id, r.isSent]))
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function toggleSent(id: string) {
    const res = await fetch(`/api/reports/${id}/sent`, { method: "PATCH" });
    if (!res.ok) { toast("Failed to update status", "error"); return; }
    const next = !sentMap[id];
    setSentMap((prev) => ({ ...prev, [id]: next }));
    toast(next ? "Marked as sent ✓" : "Unmarked", "success");
  }

  function copyReport(id: string, content: string) {
    if (!content) { toast("No report text to copy", "info"); return; }
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast("Copied to clipboard", "success");
  }

  if (reports.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-slate-700 mb-1">No reports yet</h3>
        <p className="text-sm text-slate-500 mb-4">Create your first weekly report to get started.</p>
        <Link href="/reports/new" className="btn-primary">New Report</Link>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-200 bg-surface-50">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Week</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Keywords</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
            <th className="px-4 py-3 w-40" />
          </tr>
        </thead>
        <tbody>
          {reports.map((report, idx) => (
            <>
              <tr
                key={report.id}
                className={`${idx < reports.length - 1 && expanded !== report.id ? "border-b border-surface-100" : ""} hover:bg-surface-50 transition-colors cursor-pointer`}
                onClick={() => setExpanded(expanded === report.id ? null : report.id)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{report.student.name}</div>
                  <div className="text-xs text-slate-400">{gradeLabel(report.student.grade)}</div>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                  {new Date(report.weekStart).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                  {" ~ "}
                  {new Date(report.weekEnd).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{report.subject}</td>
                <td className="px-4 py-3">
                  {report.teacherKeywords ? (
                    <span className="text-xs text-slate-400 truncate max-w-[140px] block">
                      {report.teacherKeywords}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {sentMap[report.id] ? (
                    <span className="badge-green">✓ Sent</span>
                  ) : (
                    <span className="badge-gray">Not sent</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div
                    className="flex items-center gap-1.5 justify-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => copyReport(report.id, report.parentReportText ?? "")}
                      className="btn-ghost py-1 px-2 text-xs"
                    >
                      {copiedId === report.id ? "✓" : "Copy"}
                    </button>
                    <button
                      onClick={() => toggleSent(report.id)}
                      className="btn-secondary py-1 px-2 text-xs"
                    >
                      {sentMap[report.id] ? "Unmark" : "Mark Sent"}
                    </button>
                    <Link
                      href={`/reports/${report.id}`}
                      className="btn-secondary py-1 px-2 text-xs"
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>

              {/* Expandable preview row */}
              {expanded === report.id && (
                <tr key={`${report.id}-expanded`} className="border-b border-surface-100 bg-surface-50">
                  <td colSpan={6} className="px-6 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                      Parent Report Preview
                    </p>
                    {report.parentReportText ? (
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-40 overflow-hidden">
                        {report.parentReportText.slice(0, 600)}
                        {report.parentReportText.length > 600 && "…"}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No report text saved yet.</p>
                    )}
                    <div className="mt-3">
                      <Link
                        href={`/reports/${report.id}`}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        Open full editor →
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
