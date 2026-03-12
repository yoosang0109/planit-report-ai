import fs from "node:fs";
import path from "node:path";
import { buildParentReportPrompt, buildMemoPrompt, parentSystemPrompt, memoSystemPrompt } from "../../lib/ai/prompts";
import type { ReportInput } from "../../lib/ai/types";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(`[eval failed] ${message}`);
  }
}

function main() {
  const fixturePath = path.join(process.cwd(), "evals/fixtures/report-input.sample.json");
  const input = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as ReportInput;

  const parentPrompt = buildParentReportPrompt(input);
  const memoPrompt = buildMemoPrompt(input);

  assert(parentSystemPrompt.includes("Korean"), "parent system prompt must enforce Korean");
  assert(memoSystemPrompt.includes("English"), "memo system prompt must enforce English");
  assert(parentPrompt.includes("학생 이름:"), "parent prompt should include student name label");
  assert(parentPrompt.includes(input.studentName), "parent prompt should include student name value");
  assert(parentPrompt.includes("[숙제 현황]"), "parent prompt should include homework section");
  assert(memoPrompt.includes("Student:"), "memo prompt should include Student line");
  assert(memoPrompt.includes(input.subject), "memo prompt should include subject");

  console.log("✅ prompt smoke eval passed");
}

main();
