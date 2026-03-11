"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  name: string;
  englishName: string;
  grade: string;
  classGroup: string;
}

interface WeeklyData {
  id: string;
  weekStart: string;
  topicsCovered: string;
  progressNotes: string;
  teacherObservations: string;
}

interface GenerateReportClientProps {
  students: Student[];
  preselectedStudentId?: string;
}

export function GenerateReportClient({ students, preselectedStudentId }: GenerateReportClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "generated">("form");

  // Form state
  const [studentId, setStudentId] = useState(preselectedStudentId ?? "");
  const [reportType, setReportType] = useState<"PARENT_KOREAN" | "TEACHER_NOTES">("PARENT_KOREAN");
  const [weeklyDataId, setWeeklyDataId] = useState("");
  const [freeText, setFreeText] = useState({ topicsCovered: "", progressNotes: "", teacherObservations: "" });
  const [useExistingData, setUseExistingData] = useState(true);

  // Weekly data for selected student
  const [weeklyDataList, setWeeklyDataList] = useState<WeeklyData[]>([]);
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [generatedReport, setGeneratedReport] = useState<{ id: string; editedContent: string } | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [markingSent, setMarkingSent] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Save new weekly data inline
  const [savingWeekly, setSavingWeekly] = useState(false);

  // Load weekly data when student changes
  useEffect(() => {
    if (!studentId) { setWeeklyDataList([]); return; }
    setLoadingWeekly(true);
    fetch(`/api/weekly-data/${studentId}`)
      .then((r) => r.json())
      .then((d) => { setWeeklyDataList(d.data ?? []); setWeeklyDataId(""); })
      .finally(() => setLoadingWeekly(false));
  }, [studentId]);

  async function handleSaveWeeklyData() {
    if (!studentId) return;
    setSavingWeekly(true);
    try {
      // Use Monday of current week
      const now = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);

      const res = await fetch("/api/weekly-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          weekStart: monday.toISOString(),
          ...freeText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newEntry: WeeklyData = { ...data.data, weekStart: data.data.weekStart };
      setWeeklyDataList((prev) => [newEntry, ...prev]);
      setWeeklyDataId(newEntry.id);
      setUseExistingData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save weekly data");
    } finally {
      setSavingWeekly(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const body: Record<string, unknown> = { studentId, type: reportType };
      if (useExistingData && weeklyDataId) {
        body.weeklyDataId = weeklyDataId;
      } else {
        Object.assign(body, freeText);
      }

      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate report");

      setGeneratedReport(data.data);
      setEditedContent(data.data.editedContent);
      setStep("generated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!generatedReport) return;
    setSaving(true);
    try {
      await fetch(`/api/reports/${generatedReport.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editedContent }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkSent() {
    if (!generatedReport) return;
    setMarkingSent(true);
    try {
      await fetch(`/api/reports/${generatedReport.id}/sent`, { method: "PATCH" });
      setIsSent((prev) => !prev);
    } finally {
      setMarkingSent(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(editedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const selectedStudent = students.find((s) => s.id === studentId);
  const selectedWeeklyData = weeklyDataList.find((w) => w.id === weeklyDataId);

  if (step === "generated" && generatedReport) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              {reportType === "PARENT_KOREAN" ? "🇰🇷 Korean Parent Report" : "📋 Teacher Notes"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{selectedStudent?.name} · {selectedStudent?.englishName}</p>
          </div>
          <div className="flex items-center gap-2">
            {isSent && <span className="badge-green">✓ Sent</span>}
            <button onClick={handleCopy} className="btn-secondary py-1.5 px-3 text-xs">
              {copied ? "Copied!" : "Copy"}
            </button>
            <button onClick={handleMarkSent} disabled={markingSent} className="btn-secondary py-1.5 px-3 text-xs">
              {markingSent ? "..." : isSent ? "Unmark Sent" : "Mark Sent"}
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary py-1.5 px-3 text-xs">
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
            </button>
          </div>
        </div>

        <div className="card p-5">
          <textarea
            className="w-full text-sm text-slate-800 leading-relaxed resize-none focus:outline-none min-h-[400px] font-[inherit]"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={() => router.push("/reports")} className="btn-secondary text-sm">
            View All Reports
          </button>
          <button onClick={() => { setStep("form"); setGeneratedReport(null); }} className="btn-ghost text-sm">
            Generate Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* Step 1: Select Student */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mr-2">1</span>
          Select Student
        </h2>
        <div>
          <label className="label">Student</label>
          <select
            className="input"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">— Choose a student —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.englishName}) · {s.grade}
              </option>
            ))}
          </select>
        </div>

        {selectedStudent && (
          <div className="mt-3 px-3 py-2 bg-surface-50 rounded-lg text-xs text-slate-500">
            {selectedStudent.grade} · {selectedStudent.classGroup}
          </div>
        )}
      </div>

      {/* Step 2: Weekly Data */}
      {studentId && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mr-2">2</span>
            Weekly Learning Data
          </h2>

          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={() => setUseExistingData(true)}
              className={`btn text-xs py-1.5 px-3 ${useExistingData ? "btn-primary" : "btn-secondary"}`}
            >
              Use saved record
            </button>
            <button
              type="button"
              onClick={() => setUseExistingData(false)}
              className={`btn text-xs py-1.5 px-3 ${!useExistingData ? "btn-primary" : "btn-secondary"}`}
            >
              Enter manually
            </button>
          </div>

          {useExistingData ? (
            <div>
              <label className="label">Select Week</label>
              {loadingWeekly ? (
                <p className="text-sm text-slate-400">Loading...</p>
              ) : weeklyDataList.length === 0 ? (
                <p className="text-sm text-slate-500">No saved weekly data yet. Switch to manual entry.</p>
              ) : (
                <select className="input" value={weeklyDataId} onChange={(e) => setWeeklyDataId(e.target.value)}>
                  <option value="">— Select a week —</option>
                  {weeklyDataList.map((w) => (
                    <option key={w.id} value={w.id}>
                      Week of {new Date(w.weekStart).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              )}
              {selectedWeeklyData && (
                <div className="mt-3 space-y-2 bg-surface-50 p-3 rounded-lg text-xs text-slate-600">
                  <p><strong>Topics:</strong> {selectedWeeklyData.topicsCovered}</p>
                  <p><strong>Progress:</strong> {selectedWeeklyData.progressNotes}</p>
                  <p><strong>Observations:</strong> {selectedWeeklyData.teacherObservations}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label">Topics Covered *</label>
                <textarea
                  className="textarea h-20"
                  value={freeText.topicsCovered}
                  onChange={(e) => setFreeText({ ...freeText, topicsCovered: e.target.value })}
                  placeholder="e.g. Past tense verbs, reading comprehension passage on animals..."
                />
              </div>
              <div>
                <label className="label">Progress Notes *</label>
                <textarea
                  className="textarea h-20"
                  value={freeText.progressNotes}
                  onChange={(e) => setFreeText({ ...freeText, progressNotes: e.target.value })}
                  placeholder="e.g. Strong improvement on writing. Still struggles with irregular verbs..."
                />
              </div>
              <div>
                <label className="label">Teacher Observations *</label>
                <textarea
                  className="textarea h-20"
                  value={freeText.teacherObservations}
                  onChange={(e) => setFreeText({ ...freeText, teacherObservations: e.target.value })}
                  placeholder="e.g. Very engaged, asked great questions. Completed all homework on time..."
                />
              </div>
              <button
                type="button"
                onClick={handleSaveWeeklyData}
                disabled={savingWeekly || !freeText.topicsCovered || !freeText.progressNotes || !freeText.teacherObservations}
                className="btn-secondary text-xs py-1.5"
              >
                {savingWeekly ? "Saving..." : "Save for reuse"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Report Type + Generate */}
      {studentId && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mr-2">3</span>
            Report Type
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { value: "PARENT_KOREAN" as const, label: "🇰🇷 Korean Parent Report", desc: "Formal Korean report for parents" },
              { value: "TEACHER_NOTES" as const, label: "📋 Teacher Notes", desc: "Internal English notes for staff" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setReportType(opt.value)}
                className={`flex flex-col items-start p-4 rounded-lg border-2 transition-all text-left ${
                  reportType === opt.value
                    ? "border-brand-500 bg-brand-50"
                    : "border-surface-200 hover:border-surface-300 bg-white"
                }`}
              >
                <span className="text-sm font-medium text-slate-800">{opt.label}</span>
                <span className="text-xs text-slate-500 mt-0.5">{opt.desc}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={
              generating ||
              !studentId ||
              (useExistingData && !weeklyDataId) ||
              (!useExistingData && (!freeText.topicsCovered || !freeText.progressNotes || !freeText.teacherObservations))
            }
            className="btn-primary w-full"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating with AI...
              </span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Report
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
