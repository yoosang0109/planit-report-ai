"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "@/components/Toast";

interface Report {
  id: string;
  weekStart: string;
  weekEnd: string;
  subject: string;
  classContent: string;
  homeworkStatus: string;
  attitude: string;
  understanding: string;
  absenceStatus: string;
  teacherKeywords: string | null;
  parentReportText: string | null;
  internalMemoText: string | null;
  isSent: boolean;
  sentAt: string | null;
  createdAt: string;
  student: { id: string; name: string; grade: string };
}

export function ReportDetailClient({ report: initial }: { report: Report }) {
  const [parentText, setParentText] = useState(initial.parentReportText ?? "");
  const [memoText, setMemoText] = useState(initial.internalMemoText ?? "");
  const [isSent, setIsSent] = useState(initial.isSent);
  const [saving, setSaving] = useState(false);
  const [markingSent, setMarkingSent] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/reports/${initial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentReportText: parentText,
          internalMemoText: memoText,
        }),
      });
      if (!res.ok) throw new Error();
      toast("Changes saved ✓", "success");
    } catch {
      toast("Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleSent() {
    setMarkingSent(true);
    try {
      const res = await fetch(`/api/reports/${initial.id}/sent`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      const next = !isSent;
      setIsSent(next);
      toast(next ? "Marked as sent ✓" : "Marked as unsent", "success");
    } catch {
      toast("Failed to update sent status", "error");
    } finally {
      setMarkingSent(false);
    }
  }

  function copyText(text: string, label: string) {
    if (!text) { toast(`No ${label} to copy`, "info"); return; }
    navigator.clipboard.writeText(text);
    toast(`${label} copied ✓`, "success");
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/students/${initial.student.id}`} className="text-sm text-slate-500 hover:text-slate-700">
            ← {initial.student.name}
          </Link>
          {isSent && <span className="badge-green">✓ Sent</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleSent()}
            disabled={markingSent}
            className="btn-secondary py-1.5 px-3 text-sm"
          >
            {markingSent ? "…" : isSent ? "Unmark Sent" : "Mark as Sent"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary py-1.5 px-3 text-sm"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Two-column editor */}
      <div className="grid grid-cols-2 gap-5">
        {/* Parent report */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Parent Report 🇰🇷</p>
              <p className="text-xs text-slate-500 mt-0.5">Korean report for parents</p>
            </div>
            <button
              className="btn-ghost py-1 px-2 text-xs"
              onClick={() => copyText(parentText, "Parent report")}
            >
              Copy
            </button>
          </div>
          <textarea
            className="textarea text-sm leading-relaxed font-[inherit]"
            rows={18}
            value={parentText}
            onChange={(e) => setParentText(e.target.value)}
            placeholder="Parent report text will appear here after generation…"
          />
        </div>

        {/* Internal memo */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Internal Memo</p>
              <p className="text-xs text-slate-500 mt-0.5">Staff notes, not shared with parents</p>
            </div>
            <button
              className="btn-ghost py-1 px-2 text-xs"
              onClick={() => copyText(memoText, "Internal memo")}
            >
              Copy
            </button>
          </div>
          <textarea
            className="textarea text-sm leading-relaxed font-[inherit]"
            rows={10}
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            placeholder="Internal memo will appear here after generation…"
          />

          {/* Report metadata */}
          <div className="pt-2 border-t border-surface-100 space-y-1">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Report Info</p>
            <dl className="grid grid-cols-2 gap-y-1 text-xs text-slate-600">
              <dt className="text-slate-400">Subject</dt>
              <dd>{initial.subject}</dd>
              <dt className="text-slate-400">Week</dt>
              <dd>
                {new Date(initial.weekStart).toLocaleDateString("ko-KR")}
                {" – "}
                {new Date(initial.weekEnd).toLocaleDateString("ko-KR")}
              </dd>
              <dt className="text-slate-400">Homework</dt>
              <dd>{initial.homeworkStatus}</dd>
              <dt className="text-slate-400">Attitude</dt>
              <dd>{initial.attitude}</dd>
              <dt className="text-slate-400">Understanding</dt>
              <dd>{initial.understanding}</dd>
              <dt className="text-slate-400">Attendance</dt>
              <dd>{initial.absenceStatus}</dd>
              {initial.teacherKeywords && (
                <>
                  <dt className="text-slate-400">Keywords</dt>
                  <dd className="truncate">{initial.teacherKeywords}</dd>
                </>
              )}
              <dt className="text-slate-400">Created</dt>
              <dd>{new Date(initial.createdAt).toLocaleString("ko-KR")}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
