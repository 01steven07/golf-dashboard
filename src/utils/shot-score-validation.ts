import { Shot } from "@/types/shot";

export interface ShotScoreComputeResult {
  /** ショット数 + OB + ペナルティ = 期待スコア */
  computedScore: number;
  /** パットタイプのショット数 = 期待パット */
  computedPutts: number;
  /** ショット詳細の総数 */
  totalShots: number;
  /** ティーショット数 */
  teeShots: number;
  /** アプローチ/ショット数 */
  approachShots: number;
  /** パットショット数 */
  puttShots: number;
}

/**
 * ショット詳細からスコア・パット数を計算する。
 * スコア = ショット数(物理打数) + OB数(ペナルティ打) + ペナルティ数
 * パット = パットタイプのショット数
 */
export function computeScoreFromShots(
  shots: Shot[],
  ob: number,
  penalty: number,
): ShotScoreComputeResult {
  const teeShots = shots.filter((s) => s.type === "tee").length;
  const approachShots = shots.filter((s) => s.type === "approach").length;
  const puttShots = shots.filter((s) => s.type === "putt").length;
  const totalShots = shots.length;

  return {
    computedScore: totalShots + ob + penalty,
    computedPutts: puttShots,
    totalShots,
    teeShots,
    approachShots,
    puttShots,
  };
}

export interface ShotScoreMismatch {
  field: "score" | "putts";
  expected: number;
  actual: number;
  message: string;
}

/**
 * ショット詳細と保存済みスコア/パットの不一致を検出する。
 * shots が空なら検証対象外（ショット詳細なし）として空配列を返す。
 */
export function detectShotScoreMismatch(
  shots: Shot[],
  score: number,
  putts: number,
  ob: number,
  penalty: number,
): ShotScoreMismatch[] {
  if (shots.length === 0) return [];

  const { computedScore, computedPutts, totalShots } = computeScoreFromShots(shots, ob, penalty);
  const mismatches: ShotScoreMismatch[] = [];

  if (computedScore !== score) {
    mismatches.push({
      field: "score",
      expected: computedScore,
      actual: score,
      message: `ショット数(${totalShots}) + OB(${ob}) + ペナ(${penalty}) = ${computedScore} ≠ スコア(${score})`,
    });
  }

  if (computedPutts !== putts) {
    mismatches.push({
      field: "putts",
      expected: computedPutts,
      actual: putts,
      message: `パットショット数(${computedPutts}) ≠ パット(${putts})`,
    });
  }

  return mismatches;
}
