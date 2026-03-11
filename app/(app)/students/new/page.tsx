import Link from "next/link";
import { StudentForm } from "@/features/students/StudentForm";

export default function NewStudentPage() {
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
        <h1 className="text-xl font-semibold text-slate-800">Add New Student</h1>
        <p className="text-sm text-slate-500 mt-0.5">Name and subject are required.</p>
      </div>

      <div className="card p-6 max-w-2xl">
        <StudentForm />
      </div>
    </div>
  );
}
