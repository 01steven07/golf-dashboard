import { Shot, TeeShot, ApproachShot } from "@/types/shot";
import { PinPosition } from "@/types/database";

// コース基本スタッツ
export interface CourseBasicStats {
  avgScore: number;
  avgPutts: number;
  girRate: number;
  fairwayKeepRate: number;
  roundCount: number;
}

// スコア分布
export interface ScoreDistribution {
  eagle: number;
  birdie: number;
  par: number;
  bogey: number;
  doublePlus: number;
  total: number;
}

// ティーショット傾向
export interface TeeShotTendency {
  left: number;
  center: number;
  right: number;
}

// クラブ使用分布
export interface ClubUsage {
  club: string;
  count: number;
}

// ピン位置別スコア
export interface PinPositionScore {
  position: string;
  avgOverPar: number;
  count: number;
}

// ホール別平均オーバーパー
export interface HoleScorePattern {
  hole: number;
  avgOverPar: number;
  count: number;
}

interface ScoreRow {
  hole_number: number;
  par: number;
  score: number;
  putts: number;
  fairway_result: string;
  pin_position: PinPosition | null;
  shots_detail: unknown[] | null;
}

interface RoundScores {
  scores: ScoreRow[];
}

/**
 * shots_detail JSONBのType Guard付きパース
 */
export function parseShots(shotsDetail: unknown[] | null): Shot[] {
  if (!shotsDetail || !Array.isArray(shotsDetail)) return [];

  return shotsDetail.filter((item): item is Shot => {
    if (typeof item !== "object" || item === null) return false;
    const obj = item as Record<string, unknown>;
    return obj.type === "tee" || obj.type === "approach" || obj.type === "putt";
  });
}

/**
 * コース固有の基本スタッツ算出（ラウンド単位で集計）
 */
export function calculateCourseBasicStats(rounds: RoundScores[]): CourseBasicStats {
  if (rounds.length === 0) {
    return { avgScore: 0, avgPutts: 0, girRate: 0, fairwayKeepRate: 0, roundCount: 0 };
  }

  let totalScore = 0;
  let totalPutts = 0;
  let totalHoles = 0;
  let girCount = 0;
  let fairwayKeepCount = 0;
  let fairwayHoles = 0;

  for (const round of rounds) {
    for (const s of round.scores) {
      totalScore += s.score;
      totalPutts += s.putts;
      totalHoles++;

      const strokesBeforePutt = s.score - s.putts;
      if (strokesBeforePutt <= s.par - 2) girCount++;

      if (s.par >= 4) {
        fairwayHoles++;
        if (s.fairway_result === "keep") fairwayKeepCount++;
      }
    }
  }

  return {
    avgScore: totalScore / rounds.length,
    avgPutts: totalPutts / rounds.length,
    girRate: totalHoles > 0 ? (girCount / totalHoles) * 100 : 0,
    fairwayKeepRate: fairwayHoles > 0 ? (fairwayKeepCount / fairwayHoles) * 100 : 0,
    roundCount: rounds.length,
  };
}

/**
 * スコア分布を計算（birdie/par/bogey/double+）
 */
export function calculateScoreDistribution(scores: ScoreRow[]): ScoreDistribution {
  const dist: ScoreDistribution = {
    eagle: 0,
    birdie: 0,
    par: 0,
    bogey: 0,
    doublePlus: 0,
    total: scores.length,
  };

  for (const s of scores) {
    const diff = s.score - s.par;
    if (diff <= -2) dist.eagle++;
    else if (diff === -1) dist.birdie++;
    else if (diff === 0) dist.par++;
    else if (diff === 1) dist.bogey++;
    else dist.doublePlus++;
  }

  return dist;
}

/**
 * ホール番号別の平均オーバーパー
 */
export function calculateHoleScorePattern(scores: ScoreRow[]): HoleScorePattern[] {
  const grouped = new Map<number, { totalOverPar: number; count: number }>();

  for (const s of scores) {
    if (s.hole_number < 1 || s.hole_number > 18) continue;
    const entry = grouped.get(s.hole_number) || { totalOverPar: 0, count: 0 };
    entry.totalOverPar += s.score - s.par;
    entry.count++;
    grouped.set(s.hole_number, entry);
  }

  const maxHole = Math.max(...scores.map((s) => s.hole_number), 0);

  return Array.from({ length: maxHole }, (_, i) => {
    const hole = i + 1;
    const entry = grouped.get(hole);
    return {
      hole,
      avgOverPar: entry ? entry.totalOverPar / entry.count : 0,
      count: entry?.count ?? 0,
    };
  });
}

/**
 * ティーショット傾向（fairway_result: keep/left/right）。Par4+のみ対象
 */
export function calculateTeeShotTendency(scores: ScoreRow[], holeNumber: number): TeeShotTendency {
  const holeScores = scores.filter((s) => s.hole_number === holeNumber && s.par >= 4);
  const tendency: TeeShotTendency = { left: 0, center: 0, right: 0 };

  for (const s of holeScores) {
    if (s.fairway_result === "keep") tendency.center++;
    else if (s.fairway_result === "left") tendency.left++;
    else if (s.fairway_result === "right") tendency.right++;
  }

  return tendency;
}

/**
 * アプローチ番手の集計。shots_detailからtype="approach"の最初のショットのclub集計
 */
export function calculateApproachClubs(scores: ScoreRow[], holeNumber: number): ClubUsage[] {
  const holeScores = scores.filter((s) => s.hole_number === holeNumber);
  const clubMap = new Map<string, number>();

  for (const s of holeScores) {
    const shots = parseShots(s.shots_detail);
    const approach = shots.find((shot): shot is ApproachShot => shot.type === "approach");
    if (approach) {
      clubMap.set(approach.club, (clubMap.get(approach.club) || 0) + 1);
    }
  }

  return Array.from(clubMap.entries())
    .map(([club, count]) => ({ club, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * ピン位置別の平均オーバーパー
 */
export function calculatePinPositionScores(scores: ScoreRow[], holeNumber: number): PinPositionScore[] {
  const holeScores = scores.filter((s) => s.hole_number === holeNumber && s.pin_position);
  const posMap = new Map<string, { totalOverPar: number; count: number }>();

  for (const s of holeScores) {
    if (!s.pin_position) continue;
    const entry = posMap.get(s.pin_position) || { totalOverPar: 0, count: 0 };
    entry.totalOverPar += s.score - s.par;
    entry.count++;
    posMap.set(s.pin_position, entry);
  }

  return Array.from(posMap.entries()).map(([position, data]) => ({
    position,
    avgOverPar: data.totalOverPar / data.count,
    count: data.count,
  }));
}

/**
 * ティーショットのクラブ集計（shots_detailから）
 */
export function calculateTeeShotClubs(scores: ScoreRow[], holeNumber: number): ClubUsage[] {
  const holeScores = scores.filter((s) => s.hole_number === holeNumber);
  const clubMap = new Map<string, number>();

  for (const s of holeScores) {
    const shots = parseShots(s.shots_detail);
    const teeShot = shots.find((shot): shot is TeeShot => shot.type === "tee");
    if (teeShot) {
      clubMap.set(teeShot.club, (clubMap.get(teeShot.club) || 0) + 1);
    }
  }

  return Array.from(clubMap.entries())
    .map(([club, count]) => ({ club, count }))
    .sort((a, b) => b.count - a.count);
}
