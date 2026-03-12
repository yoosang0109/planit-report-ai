"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gradeLabel, levelLabel, LEVEL_COLORS } from "@/lib/display";

interface Student {
  id: string;
  name: string;
  subject: string;
  grade: string;
  level: string;
  school: string | null;
  parentName: string | null;
  isActive: boolean;
  _count: { reports: number };
}

export function StudentsListClient({ initialStudents }: { initialStudents: Student[] }) {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  const fetchStudents = useCallback(
    async (q: string, inactive: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q) params.set("search", q);
        if (inactive) params.set("activeOnly", "false");
        const res = await fetch(`/api/students?${params}`);
        const data = await res.json();
        setStudents(data.data ?? []);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  function handleSearch(value: string) {
    setSearch(value);
    startTransition(() => fetchStudents(value, showInactive));
  }

  function handleToggleInactive() {
    const next = !showInactive;
    setShowInactive(next);
    startTransition(() => fetchStudents(search, next));
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}? All reports will be removed.`)) return;
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    setStudents((prev) => prev.filter((s) => s.id !== id));
    router.refresh();
  }

  return (
    <div>
      {/* Search + Filter bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input pl-9"
            placeholder="Search by name, subject, school, parent..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={handleToggleInactive}
            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Show inactive
        </label>

        <span className="text-xs text-slate-400 ml-auto">
          {loading ? "Searching..." : `${students.length} student${students.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Empty state */}
      {students.length === 0 && !loading && (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          {search ? (
            <>
              <h3 className="text-sm font-medium text-slate-700 mb-1">No results for &ldquo;{search}&rdquo;</h3>
              <p className="text-sm text-slate-500">Try a different name or subject.</p>
            </>
          ) : (
            <>
              <h3 className="text-sm font-medium text-slate-700 mb-1">No students yet</h3>
              <p className="text-sm text-slate-500 mb-4">Add your first student to get started.</p>
              <Link href="/students/new" className="btn-primary">Add Student</Link>
            </>
          )}
        </div>
      )}

      {/* Table */}
      {students.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Grade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Level</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Parent</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reports</th>
                <th className="px-4 py-3 w-44"></th>
              </tr>
            </thead>
            <tbody className={loading ? "opacity-50 pointer-events-none" : ""}>
              {students.map((student, idx) => (
                <tr
                  key={student.id}
                  className={`${idx < students.length - 1 ? "border-b border-surface-100" : ""} hover:bg-surface-50 transition-colors`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{student.name}</span>
                      {!student.isActive && (
                        <span className="badge badge-gray text-[10px]">Inactive</span>
                      )}
                    </div>
                    {student.school && (
                      <p className="text-xs text-slate-400 mt-0.5">{student.school}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{student.subject}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{gradeLabel(student.grade)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${LEVEL_COLORS[student.level] ?? "badge-gray"}`}>
                      {levelLabel(student.level)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{student.parentName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="badge-blue">{student._count.reports}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Link href={`/reports/new?studentId=${student.id}`} className="btn-primary py-1 px-2.5 text-xs">
                        Report
                      </Link>
                      <Link href={`/students/${student.id}`} className="btn-secondary py-1 px-2.5 text-xs">
                        View
                      </Link>
                      <Link href={`/students/${student.id}/edit`} className="btn-ghost py-1 px-2 text-xs">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(student.id, student.name)}
                        className="btn-ghost py-1 px-2 text-xs text-red-500 hover:bg-red-50"
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
