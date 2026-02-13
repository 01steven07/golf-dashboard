import { Score } from "@/types/database";

export interface RoundSummary {
  totalScore: number;
  totalPar: number;
  totalPutts: number;
  fairwayKeepRate: number;
  girRate: number;
  obCount: number;
  outScore: number;
  outPar: number;
  outPutts: number;
  inScore: number;
  inPar: number;
  inPutts: number;
}

/**
 * ラウンド1回分のサマリーを算出
 */
export function calculateRoundSummary(scores: Score[]): RoundSummary {
  const outScores = scores.filter((s) => s.hole_number >= 1 && s.hole_number <= 9);
  const inScores = scores.filter((s) => s.hole_number >= 10 && s.hole_number <= 18);

  let totalScore = 0;
  let totalPar = 0;
  let totalPutts = 0;
  let obCount = 0;
  let girCount = 0;
  let totalHoles = 0;
  let fairwayKeepCount = 0;
  let fairwayHoles = 0;

  for (const s of scores) {
    totalScore += s.score;
    totalPar += s.par;
    totalPutts += s.putts;
    obCount += s.ob;
    totalHoles++;

    const strokesBeforePutt = s.score - s.putts;
    if (strokesBeforePutt <= s.par - 2) girCount++;

    if (s.par >= 4) {
      fairwayHoles++;
      if (s.fairway_result === "keep") fairwayKeepCount++;
    }
  }

  const sum = (arr: Score[], key: "score" | "par" | "putts") =>
    arr.reduce((acc, s) => acc + s[key], 0);

  return {
    totalScore,
    totalPar,
    totalPutts,
    fairwayKeepRate: fairwayHoles > 0 ? (fairwayKeepCount / fairwayHoles) * 100 : 0,
    girRate: totalHoles > 0 ? (girCount / totalHoles) * 100 : 0,
    obCount,
    outScore: sum(outScores, "score"),
    outPar: sum(outScores, "par"),
    outPutts: sum(outScores, "putts"),
    inScore: sum(inScores, "score"),
    inPar: sum(inScores, "par"),
    inPutts: sum(inScores, "putts"),
  };
}

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

/**
 * 日付フォーマット: "2026-02-10" → "2/10 (火)"
 */
export function formatRoundDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = DAY_NAMES[date.getDay()];
  return `${month}/${day} (${dayName})`;
}

/**
 * 月グループ: "2026-02-10" → "2026年2月"
 */
export function formatMonthGroup(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}
