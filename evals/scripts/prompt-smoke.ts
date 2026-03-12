import fs from "node:fs";
import path from "node:path";
import { buildParentReportPrompt, buildMemoPrompt, buildParentSystemPrompt, memoSystemPrompt } from "../../lib/ai/prompts";
import type { ReportInput } from "../../lib/ai/types";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`[eval failed] ${message}`);
}

function main() {
  const fixturePath = path.join(process.cwd(), "evals/fixtures/report-input.sample.json");
  const input = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as ReportInput;

  const parentPrompt = buildParentReportPrompt(input);
  const memoPrompt = buildMemoPrompt(input);
  const parentSystemPrompt = buildParentSystemPrompt("warm", [
    {
      toneStyle: "professional",
      openingSentence: "안녕하세요. 이번 주 수업 내용을 공유드립니다.",
      closingSentence: "다음 주에도 잘 부탁드립니다.",
      frequentPraisePhrases: ["성장", "노력"],
    },
  ]);

  assert(parentSystemPrompt.includes("Tone style for this generation: warm"), "must include selected tone style");
  assert(parentSystemPrompt.includes("DO NOT reuse same opening sentence"), "must contain anti-repetition rule");
  assert(parentSystemPrompt.includes("꾸준히 성장하고 있습니다"), "must include banned cliché list");
  assert(memoSystemPrompt.includes("English"), "memo system prompt must enforce English");
  assert(parentPrompt.includes("학생 이름:"), "parent prompt should include student name label");
  assert(parentPrompt.includes(input.studentName), "parent prompt should include student name value");
  assert(memoPrompt.includes("Student:"), "memo prompt should include Student line");

  console.log("✅ prompt smoke eval passed");
}

main();
