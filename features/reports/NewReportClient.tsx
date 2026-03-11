"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  HOMEWORK_STATUSES,
  ABSENCE_STATUSES,
  MAKEUP_STATUSES,
  ATTITUDES,
} from "@/lib/validations";
import { gradeLabel } from "@/lib/display";
import { toast } from "@/components/Toast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Student {
  id: string;
  name: string;
  grade: string;
  subject: string;
  level: string;
  parentName: string | null;
  defaultTone: string;
}

interface FormState {
  studentId: string;
  subject: string;
  weekStart: string;
  weekEnd: string;
  classContent: string;
  homeworkStatus: string;
  homeworkNote: string;
  testScore: string;
  attitude: string;
  understanding: string;
  absenceStatus: string;
  makeupClassStatus: string;
  nextPlan: string;
  teacherKeywords: string;
}

interface PreviewState {
  parentReportText: string;
  internalMemoText: string;
}

interface NewReportClientProps {
  students: Student[];
  preselectedStudentId?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWeekBounds() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  return {
    weekStart: monday.toISOString().slice(0, 10),
    weekEnd: friday.toISOString().slice(0, 10),
  };
}

const DEFAULT_FORM: Omit<FormState, "studentId"> = {
  subject: "",
  ...getWeekBounds(),
  classContent: "",
  homeworkStatus: "NOT_ASSIGNED",
  homeworkNote: "",
  testScore: "",
  attitude: "GOOD",
  understanding: "GOOD",
  absenceStatus: "PRESENT",
  makeupClassStatus: "NOT_NEEDED",
  nextPlan: "",
  teacherKeywords: "",
};

const UNDERSTANDING_OPTIONS = [
  { value: "EXCELLENT", label: "Excellent" },
  { value: "GOOD", label: "Good" },
  { value: "AVERAGE", label: "Average" },
  { value: "NEEDS_IMPROVEMENT", label: "Needs Improvement" },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FieldLabel({ htmlFor, children, optional }: { htmlFor?: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="label flex items-center gap-1">
      {children}
      {optional && <span className="normal-case text-slate-400 font-normal tracking-normal ml-1">(optional)</span>}
    </label>
  );
}

function SelectField({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      id={id}
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// Badge used in the preview area header
function StatusBadge({ isSent }: { isSent: boolean }) {
  return isSent ? (
    <span className="badge-green flex items-center gap-1">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 14 4.293 9.879a1 1 0 011.414-1.414L8.414 11.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      Sent
    </span>
  ) : null;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function NewReportClient({ students, preselectedStudentId }: NewReportClientProps) {
  const router = useRouter();

  // ------ Student selection ------
  const [studentId, setStudentId] = useState(preselectedStudentId ?? "");
  const selectedStudent = students.find((s) => s.id === studentId) ?? null;

  // ------ Form state ------
  const [form, setForm] = useState<FormState>({
    studentId: preselectedStudentId ?? "",
    ...DEFAULT_FORM,
    subject: "",
  });

  // Sync selectedStudent subject into form when student changes
  const handleStudentChange = useCallback(
    (id: string) => {
      setStudentId(id);
      const student = students.find((s) => s.id === id);
      setForm((prev) => ({
        ...prev,
        studentId: id,
        subject: student?.subject ?? prev.subject,
      }));
    },
    [students]
  );

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ------ Preview/editor state ------
  const [preview, setPreview] = useState<PreviewState>({
    parentReportText: "",
    internalMemoText: "",
  });

  // ------ Status flags ------
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [saving, setSaving] = useState<"draft" | "final" | null>(null);
  const [markingSent, setMarkingSent] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<"parent" | "memo" | null>(null);

  // ------ Validate minimum required fields ------
  const canSave = !!studentId && !!form.weekStart && !!form.weekEnd && form.classContent.trim().length > 0;

  // ------ Build payload ------
  function buildPayload() {
    return {
      studentId: form.studentId,
      subject: form.subject || undefined,
      weekStart: new Date(form.weekStart).toISOString(),
      weekEnd: new Date(form.weekEnd).toISOString(),
      classContent: form.classContent,
      homeworkStatus: form.homeworkStatus,
      homeworkNote: form.homeworkNote || undefined,
      testScore: form.testScore !== "" ? parseInt(form.testScore, 10) : null,
      attitude: form.attitude,
      understanding: form.understanding,
      absenceStatus: form.absenceStatus,
      makeupClassStatus: form.makeupClassStatus,
      nextPlan: form.nextPlan || undefined,
      teacherKeywords: form.teacherKeywords || undefined,
      parentReportText: preview.parentReportText || undefined,
      internalMemoText: preview.internalMemoText || undefined,
    };
  }

  async function persistReport(kind: "draft" | "final") {
    setSaving(kind);
    try {
      const payload = buildPayload();
      let reportId = savedReportId;

      if (!reportId) {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to save report");
        reportId = data.data.id;
        setSavedReportId(reportId);
      } else {
        const res = await fetch(`/api/reports/${reportId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to update report");
      }

      if (kind === "final") {
        toast("Report saved! Redirecting…", "success");
        setTimeout(() => router.push("/reports"), 1200);
      } else {
        toast("Draft saved ✓", "success");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setSaving(null);
    }
  }

  async function handleGenerateAI() {
    if (!selectedStudent || !form.classContent.trim()) return;
    setGenerating(true);
    try {
      const weekRange = `${form.weekStart} ~ ${form.weekEnd}`;
      const res = await fetch("/api/ai/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: selectedStudent.name,
          subject: form.subject || selectedStudent.subject,
          weekRange,
          classContent: form.classContent,
          homeworkStatus: form.homeworkStatus,
          homeworkNote: form.homeworkNote || undefined,
          testScore: form.testScore !== "" ? parseInt(form.testScore, 10) : null,
          attitude: form.attitude,
          understanding: form.understanding,
          absenceStatus: form.absenceStatus,
          makeupClassStatus: form.makeupClassStatus,
          nextPlan: form.nextPlan || undefined,
          teacherKeywords: form.teacherKeywords || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setPreview({
        parentReportText: data.data.parentReport,
        internalMemoText: data.data.internalMemo,
      });
      toast("AI report generated ✨", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "AI generation failed", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleMarkSent() {
    if (!savedReportId) return;
    setMarkingSent(true);
    try {
      const res = await fetch(`/api/reports/${savedReportId}/sent`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to update sent status");
      const next = !isSent;
      setIsSent(next);
      toast(next ? "Marked as sent ✓" : "Marked as unsent", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setMarkingSent(false);
    }
  }

  function handleCopy(field: "parent" | "memo") {
    const text = field === "parent" ? preview.parentReportText : preview.internalMemoText;
    if (!text) { toast("Nothing to copy yet", "info"); return; }
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
    toast("Copied to clipboard ✓", "success");
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">

      {/* ---- STEP 0: Student Selector ---- */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
            1
          </div>
          <h2 className="text-sm font-semibold text-slate-700">Select Student</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="student-select">Student</FieldLabel>
            <select
              id="student-select"
              className="input"
              value={studentId}
              onChange={(e) => handleStudentChange(e.target.value)}
            >
              <option value="">— Choose a student —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {gradeLabel(s.grade)}
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <div className="flex flex-col justify-end pb-0.5">
              <div className="px-3 py-2 bg-surface-50 rounded-lg text-xs text-slate-600 space-y-0.5">
                <div className="flex gap-2 flex-wrap">
                  <span className="font-medium">{selectedStudent.name}</span>
                  <span className="text-slate-400">·</span>
                  <span>{gradeLabel(selectedStudent.grade)}</span>
                  <span className="text-slate-400">·</span>
                  <span>{selectedStudent.subject}</span>
                </div>
                {selectedStudent.parentName && (
                  <div className="text-slate-500">Parent: {selectedStudent.parentName}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---- MAIN TWO-COLUMN AREA ---- */}
      {studentId && (
        <div className="grid grid-cols-[1fr_1fr] gap-6 items-start">

          {/* ==================== LEFT: INPUT FORM ==================== */}
          <div className="space-y-5">

            {/* Section header */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
              <h2 className="text-sm font-semibold text-slate-700">Weekly Report Details</h2>
            </div>

            {/* --- Class Info --- */}
            <div className="card p-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Class Info</p>

              <div>
                <FieldLabel htmlFor="subject">Subject</FieldLabel>
                <input
                  id="subject"
                  type="text"
                  className="input"
                  value={form.subject}
                  onChange={(e) => setField("subject", e.target.value)}
                  placeholder="e.g. English, Math..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="weekStart">Week Start</FieldLabel>
                  <input
                    id="weekStart"
                    type="date"
                    className="input"
                    value={form.weekStart}
                    onChange={(e) => setField("weekStart", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="weekEnd">Week End</FieldLabel>
                  <input
                    id="weekEnd"
                    type="date"
                    className="input"
                    value={form.weekEnd}
                    onChange={(e) => setField("weekEnd", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="classContent">Class Content *</FieldLabel>
                <textarea
                  id="classContent"
                  className="textarea"
                  rows={4}
                  placeholder="What was covered in class this week? Topics, activities, exercises..."
                  value={form.classContent}
                  onChange={(e) => setField("classContent", e.target.value)}
                />
              </div>
            </div>

            {/* --- Homework & Assessment --- */}
            <div className="card p-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Homework & Assessment</p>

              <div>
                <FieldLabel htmlFor="homeworkStatus">Homework Status</FieldLabel>
                <SelectField
                  id="homeworkStatus"
                  value={form.homeworkStatus}
                  onChange={(v) => setField("homeworkStatus", v)}
                  options={HOMEWORK_STATUSES as unknown as { value: string; label: string }[]}
                />
              </div>

              <div>
                <FieldLabel htmlFor="homeworkNote" optional>Homework Note</FieldLabel>
                <input
                  id="homeworkNote"
                  type="text"
                  className="input"
                  placeholder="Any specific notes about homework..."
                  value={form.homeworkNote}
                  onChange={(e) => setField("homeworkNote", e.target.value)}
                />
              </div>

              <div>
                <FieldLabel htmlFor="testScore" optional>Test Score (0-100)</FieldLabel>
                <input
                  id="testScore"
                  type="number"
                  className="input"
                  min={0}
                  max={100}
                  placeholder="Leave blank if no test"
                  value={form.testScore}
                  onChange={(e) => setField("testScore", e.target.value)}
                />
              </div>
            </div>

            {/* --- Observation --- */}
            <div className="card p-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Observation</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="attitude">Attitude</FieldLabel>
                  <SelectField
                    id="attitude"
                    value={form.attitude}
                    onChange={(v) => setField("attitude", v)}
                    options={ATTITUDES as unknown as { value: string; label: string }[]}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="understanding">Understanding</FieldLabel>
                  <SelectField
                    id="understanding"
                    value={form.understanding}
                    onChange={(v) => setField("understanding", v)}
                    options={UNDERSTANDING_OPTIONS}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="absenceStatus">Attendance</FieldLabel>
                  <SelectField
                    id="absenceStatus"
                    value={form.absenceStatus}
                    onChange={(v) => setField("absenceStatus", v)}
                    options={ABSENCE_STATUSES as unknown as { value: string; label: string }[]}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="makeupClassStatus">Makeup Class</FieldLabel>
                  <SelectField
                    id="makeupClassStatus"
                    value={form.makeupClassStatus}
                    onChange={(v) => setField("makeupClassStatus", v)}
                    options={MAKEUP_STATUSES as unknown as { value: string; label: string }[]}
                  />
                </div>
              </div>
            </div>

            {/* --- Planning & AI Hints --- */}
            <div className="card p-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Planning & AI Hints</p>

              <div>
                <FieldLabel htmlFor="nextPlan" optional>Next Week Plan</FieldLabel>
                <textarea
                  id="nextPlan"
                  className="textarea"
                  rows={3}
                  placeholder="What will be covered next week?"
                  value={form.nextPlan}
                  onChange={(e) => setField("nextPlan", e.target.value)}
                />
              </div>

              <div>
                <FieldLabel htmlFor="teacherKeywords" optional>AI Keywords</FieldLabel>
                <input
                  id="teacherKeywords"
                  type="text"
                  className="input"
                  placeholder="Comma-separated hints for AI: e.g. enthusiastic, shy, reading focused"
                  value={form.teacherKeywords}
                  onChange={(e) => setField("teacherKeywords", e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Keywords help AI personalize the tone of the parent report.
                </p>
              </div>
            </div>

            {/* --- Action Buttons (left side bottom) --- */}
            <div className="flex gap-3">
              <button
                className="btn-secondary text-sm flex-1"
                disabled={!canSave || saving !== null}
                onClick={() => persistReport("draft")}
              >
                {saving === "draft" ? (
                  <span className="flex items-center gap-2">
                    <SpinnerIcon />
                    Saving…
                  </span>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Draft
                  </>
                )}
              </button>

              <button
                className="btn-primary text-sm flex-1"
                disabled={!canSave || saving !== null}
                onClick={() => persistReport("final")}
              >
                {saving === "final" ? (
                  <span className="flex items-center gap-2">
                    <SpinnerIcon />
                    Saving…
                  </span>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Final Save
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ==================== RIGHT: PREVIEW / EDITOR ==================== */}
          <div className="space-y-5">

            {/* Section header with action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
                <h2 className="text-sm font-semibold text-slate-700">Report Preview & Editor</h2>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge isSent={isSent} />
                {savedReportId && (
                  <button
                    className="btn-secondary text-xs py-1.5 px-3"
                    disabled={markingSent}
                    onClick={handleMarkSent}
                  >
                    {markingSent ? "..." : isSent ? "Unmark Sent" : "Mark as Sent"}
                  </button>
                )}
              </div>
            </div>

            {/* Generate AI Report Button */}
            <button
              className="btn-primary w-full text-sm gap-2"
              disabled={!canSave || generating}
              onClick={handleGenerateAI}
            >
              {generating ? (
                <>
                  <SpinnerIcon />
                  Generating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate AI Report
                </>
              )}
            </button>

            {/* Parent Report */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Parent Report</p>
                  <p className="text-xs text-slate-500 mt-0.5">Korean report sent to parents 🇰🇷</p>
                </div>
                <button
                  className="btn-ghost py-1 px-2 text-xs"
                  onClick={() => handleCopy("parent")}
                  disabled={!preview.parentReportText}
                >
                  {copied === "parent" ? "Copied!" : (
                    <span className="flex items-center gap-1">
                      <CopyIcon />
                      Copy
                    </span>
                  )}
                </button>
              </div>

              <textarea
                id="parentReportText"
                className="textarea text-sm leading-relaxed font-[inherit]"
                rows={12}
                placeholder="Generate with AI, or type the parent-facing report here (Korean)…"
                value={preview.parentReportText}
                onChange={(e) => setPreview((p) => ({ ...p, parentReportText: e.target.value }))}
              />
            </div>

            {/* Internal Memo */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Internal Memo</p>
                  <p className="text-xs text-slate-500 mt-0.5">Teacher/staff notes, not shared with parents</p>
                </div>
                <button
                  className="btn-ghost py-1 px-2 text-xs"
                  onClick={() => handleCopy("memo")}
                  disabled={!preview.internalMemoText}
                >
                  {copied === "memo" ? "Copied!" : (
                    <span className="flex items-center gap-1">
                      <CopyIcon />
                      Copy
                    </span>
                  )}
                </button>
              </div>

              <textarea
                id="internalMemoText"
                className="textarea text-sm leading-relaxed font-[inherit]"
                rows={7}
                placeholder="Generate with AI, or write internal notes here…"
                value={preview.internalMemoText}
                onChange={(e) => setPreview((p) => ({ ...p, internalMemoText: e.target.value }))}
              />
            </div>

            {/* Quick-access field summary */}
            {(form.testScore || form.teacherKeywords) && (
              <div className="card p-4 bg-surface-50 border-dashed">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Form Summary</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                  {form.testScore && <span>Test: <strong>{form.testScore}/100</strong></span>}
                  {form.attitude && <span>Attitude: <strong>{ATTITUDES.find(a => a.value === form.attitude)?.label}</strong></span>}
                  {form.understanding && <span>Understanding: <strong>{UNDERSTANDING_OPTIONS.find(u => u.value === form.understanding)?.label}</strong></span>}
                  {form.homeworkStatus && (
                    <span>
                      Homework: <strong>
                        {HOMEWORK_STATUSES.find((h) => h.value === form.homeworkStatus)?.label}
                      </strong>
                    </span>
                  )}
                  {form.absenceStatus && (
                    <span>
                      Attendance: <strong>
                        {ABSENCE_STATUSES.find((a) => a.value === form.absenceStatus)?.label}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state when no student selected */}
      {!studentId && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-500">Select a student above to begin</p>
          <p className="text-xs text-slate-400 mt-1">
            The report form and preview will appear once you choose a student.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tiny inline SVG helpers
// ---------------------------------------------------------------------------

function SpinnerIcon() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
