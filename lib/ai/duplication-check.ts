import type { PreviousReportContext } from "./types";

const BANNED_EXPRESSIONS = [
  "꾸준히 성장하고 있습니다",
  "성실하게 잘 따라오고 있습니다",
  "앞으로도 기대됩니다",
] as const;

const PRAISE_WORDS = ["칭찬", "노력", "성장", "참여", "태도", "우수", "훌륭"] as const;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitBigrams(value: string): Set<string> {
  const source = normalize(value).replace(/\s/g, "");
  const result = new Set<string>();
  for (let i = 0; i < source.length - 1; i += 1) {
    result.add(source.slice(i, i + 2));
  }
  return result;
}

function diceSimilarity(a: string, b: string): number {
  const aBigrams = splitBigrams(a);
  const bBigrams = splitBigrams(b);
  if (aBigrams.size === 0 || bBigrams.size === 0) return 0;

  const aItems = Array.from(aBigrams);
  const overlap = aItems.filter((item) => bBigrams.has(item)).length;

  return (2 * overlap) / (aBigrams.size + bBigrams.size);
}

function getSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface DuplicationCheckResult {
  firstSentenceMaxSimilarity: number;
  lastSentenceMaxSimilarity: number;
  bannedExpressionsFound: string[];
  repeatedPraiseWords: string[];
  severe: boolean;
  warnings: string[];
}

export function checkParentReportDuplication(parentReportText: string, recentReports: PreviousReportContext[]): DuplicationCheckResult {
  const sentences = getSentences(parentReportText);
  const firstSentence = sentences[0] ?? "";
  const lastSentence = sentences[sentences.length - 1] ?? "";

  let firstSentenceMaxSimilarity = 0;
  let lastSentenceMaxSimilarity = 0;

  recentReports.forEach((report) => {
    if (report.openingSentence) {
      firstSentenceMaxSimilarity = Math.max(
        firstSentenceMaxSimilarity,
        diceSimilarity(firstSentence, report.openingSentence),
      );
    }

    if (report.closingSentence) {
      lastSentenceMaxSimilarity = Math.max(
        lastSentenceMaxSimilarity,
        diceSimilarity(lastSentence, report.closingSentence),
      );
    }
  });

  const bannedExpressionsFound = BANNED_EXPRESSIONS.filter((phrase) => parentReportText.includes(phrase));
  const recentPraiseSet = new Set(recentReports.flatMap((r) => r.frequentPraisePhrases ?? []));
  const repeatedPraiseWords = PRAISE_WORDS.filter((word) => recentPraiseSet.has(word) && parentReportText.includes(word));

  const warnings: string[] = [];
  if (firstSentenceMaxSimilarity >= 0.8) warnings.push("첫 문장 유사도가 높습니다.");
  if (lastSentenceMaxSimilarity >= 0.8) warnings.push("마지막 문장 유사도가 높습니다.");
  if (bannedExpressionsFound.length > 0) warnings.push(`금지 표현 사용: ${bannedExpressionsFound.join(", ")}`);
  if (repeatedPraiseWords.length >= 2) warnings.push(`칭찬 표현 반복 가능성: ${repeatedPraiseWords.join(", ")}`);

  const severe =
    firstSentenceMaxSimilarity >= 0.9 ||
    lastSentenceMaxSimilarity >= 0.9 ||
    bannedExpressionsFound.length > 0;

  return {
    firstSentenceMaxSimilarity,
    lastSentenceMaxSimilarity,
    bannedExpressionsFound,
    repeatedPraiseWords,
    severe,
    warnings,
  };
}
