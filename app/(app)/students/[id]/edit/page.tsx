import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StudentForm } from "@/features/students/StudentForm";

export default async function EditStudentPage({ params }: { params: { id: string } }) {
  const student = await prisma.student.findUnique({ where: { id: params.id } });
  if (!student) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/students/${student.id}`}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to {student.name}
        </Link>
        <h1 className="text-xl font-semibold text-slate-800">Edit Student</h1>
        <p className="text-sm text-slate-500 mt-0.5">Name and subject are required.</p>
      </div>

      <div className="card p-6 max-w-2xl">
        <StudentForm
          student={{
            id: student.id,
            name: student.name,
            subject: student.subject,
            grade: student.grade as "ELEM_1"|"ELEM_2"|"ELEM_3"|"ELEM_4"|"ELEM_5"|"ELEM_6"|"MIDDLE_1"|"MIDDLE_2"|"MIDDLE_3"|"HIGH_1"|"HIGH_2"|"HIGH_3"|"OTHER",
            school: student.school,
            level: student.level as "BEGINNER"|"ELEMENTARY"|"INTERMEDIATE"|"UPPER_INTERMEDIATE"|"ADVANCED",
            parentName: student.parentName,
            parentPhone: student.parentPhone,
            defaultTone: student.defaultTone as "FORMAL"|"FRIENDLY"|"ENCOURAGING"|"DETAILED",
            notes: student.notes,
            isActive: student.isActive,
          }}
        />
      </div>
    </div>
  );
}
