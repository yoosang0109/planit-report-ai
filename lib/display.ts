import { GRADES, LEVELS, TONES } from "@/lib/validations";

export function gradeLabel(value: string) {
  return GRADES.find((g) => g.value === value)?.label ?? value;
}

export function levelLabel(value: string) {
  return LEVELS.find((l) => l.value === value)?.label ?? value;
}

export function toneLabel(value: string) {
  return TONES.find((t) => t.value === value)?.label ?? value;
}

export const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "bg-slate-100 text-slate-600",
  ELEMENTARY: "bg-blue-100 text-blue-700",
  INTERMEDIATE: "bg-emerald-100 text-emerald-700",
  UPPER_INTERMEDIATE: "bg-amber-100 text-amber-700",
  ADVANCED: "bg-purple-100 text-purple-700",
};
