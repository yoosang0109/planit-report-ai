"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GRADES, LEVELS, TONES,
  type CreateStudentInput,
} from "@/lib/validations";

type Grade = "ELEM_1"|"ELEM_2"|"ELEM_3"|"ELEM_4"|"ELEM_5"|"ELEM_6"|"MIDDLE_1"|"MIDDLE_2"|"MIDDLE_3"|"HIGH_1"|"HIGH_2"|"HIGH_3"|"OTHER";
type Level = "BEGINNER"|"ELEMENTARY"|"INTERMEDIATE"|"UPPER_INTERMEDIATE"|"ADVANCED";
type DefaultTone = "FORMAL"|"FRIENDLY"|"ENCOURAGING"|"DETAILED";

interface StudentData {
  id: string;
  name: string;
  subject: string;
  grade: Grade;
  school: string | null;
  level: Level;
  parentName: string | null;
  parentPhone: string | null;
  defaultTone: DefaultTone;
  notes: string | null;
  isActive: boolean;
}

interface StudentFormProps {
  student?: StudentData;
}

const defaultValues: CreateStudentInput = {
  name: "",
  subject: "",
  grade: "OTHER",
  school: "",
  level: "INTERMEDIATE",
  parentName: "",
  parentPhone: "",
  defaultTone: "FRIENDLY",
  notes: "",
  isActive: true,
};

export function StudentForm({ student }: StudentFormProps) {
  const router = useRouter();
  const isEditing = !!student;

  const [form, setForm] = useState<CreateStudentInput>({
    name: student?.name ?? defaultValues.name,
    subject: student?.subject ?? defaultValues.subject,
    grade: (student?.grade ?? defaultValues.grade) as Grade,
    school: student?.school ?? defaultValues.school,
    level: (student?.level ?? defaultValues.level) as Level,
    parentName: student?.parentName ?? defaultValues.parentName,
    parentPhone: student?.parentPhone ?? defaultValues.parentPhone,
    defaultTone: (student?.defaultTone ?? defaultValues.defaultTone) as DefaultTone,
    notes: student?.notes ?? defaultValues.notes,
    isActive: student?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateStudentInput, string>>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate(): boolean {
    const newErrors: Partial<Record<keyof CreateStudentInput, string>> = {};
    if (!form.name?.trim()) newErrors.name = "이름은 필수입니다 (Name is required)";
    if (!form.subject?.trim()) newErrors.subject = "과목은 필수입니다 (Subject is required)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const field = <K extends keyof CreateStudentInput>(key: K, value: CreateStudentInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError("");

    try {
      const url = isEditing ? `/api/students/${student.id}` : "/api/students";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save student");

      router.push(`/students/${data.data.id}`);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {serverError}
        </div>
      )}

      {/* ── Section: Core info ─────────────────────────────────────────── */}
      <fieldset className="mb-6">
        <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
          Student Info
        </legend>

        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="label">
              Student Name <span className="text-red-500">*</span>
            </label>
            <input
              className={`input ${errors.name ? "border-red-400 focus:ring-red-400" : ""}`}
              value={form.name}
              onChange={(e) => field("name", e.target.value)}
              placeholder="김민준"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Subject */}
          <div>
            <label className="label">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              className={`input ${errors.subject ? "border-red-400 focus:ring-red-400" : ""}`}
              value={form.subject}
              onChange={(e) => field("subject", e.target.value)}
              placeholder="영어 / 수학"
            />
            {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
          </div>

          {/* Grade */}
          <div>
            <label className="label">Grade</label>
            <select
              className="input"
              value={form.grade}
              onChange={(e) => field("grade", e.target.value as Grade)}
            >
              {GRADES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* School */}
          <div>
            <label className="label">School</label>
            <input
              className="input"
              value={form.school ?? ""}
              onChange={(e) => field("school", e.target.value)}
              placeholder="서울초등학교"
            />
          </div>

          {/* Level */}
          <div>
            <label className="label">Level</label>
            <select
              className="input"
              value={form.level}
              onChange={(e) => field("level", e.target.value as Level)}
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Default Tone */}
          <div>
            <label className="label">Default Report Tone</label>
            <select
              className="input"
              value={form.defaultTone}
              onChange={(e) => field("defaultTone", e.target.value as DefaultTone)}
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* ── Section: Parent Contact ─────────────────────────────────────── */}
      <fieldset className="mb-6">
        <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
          Parent Contact
        </legend>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Parent Name</label>
            <input
              className="input"
              value={form.parentName ?? ""}
              onChange={(e) => field("parentName", e.target.value)}
              placeholder="김지수"
            />
          </div>
          <div>
            <label className="label">Parent Phone</label>
            <input
              className="input"
              value={form.parentPhone ?? ""}
              onChange={(e) => field("parentPhone", e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
        </div>
      </fieldset>

      {/* ── Section: Notes & Status ─────────────────────────────────────── */}
      <fieldset className="mb-6">
        <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
          Notes & Status
        </legend>

        <div>
          <label className="label">Internal Notes</label>
          <textarea
            className="textarea h-28"
            value={form.notes ?? ""}
            onChange={(e) => field("notes", e.target.value)}
            placeholder="발음 교정 필요, 수업 참여도 높음, 학부모 선호 사항 등..."
          />
        </div>

        {isEditing && (
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              onClick={() => field("isActive", !form.isActive)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                form.isActive ? "bg-brand-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.isActive ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-slate-600">
              {form.isActive ? "Active student" : "Inactive / archived"}
            </span>
          </div>
        )}
      </fieldset>

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2 border-t border-surface-100">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          ) : isEditing ? (
            "Save Changes"
          ) : (
            "Add Student"
          )}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
