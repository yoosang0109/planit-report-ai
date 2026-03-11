import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StudentsListClient } from "@/features/students/StudentsListClient";

async function getStudents() {
  return prisma.student.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { reports: true } },
    },
  });
}

export default async function StudentsPage() {
  const students = await getStudents();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Students</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage enrolled students</p>
        </div>
        <Link href="/students/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </Link>
      </div>

      <StudentsListClient initialStudents={students} />
    </div>
  );
}
