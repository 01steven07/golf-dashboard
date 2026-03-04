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

  let normalizedScoreSum = 0;
  let normalizedPuttsSum = 0;
  let totalHoles = 0;
  let girCount = 0;
  let fairwayKeepCount = 0;
  let fairwayHoles = 0;

  for (const round of rounds) {
    let roundScore = 0;
    let roundPutts = 0;

    for (const s of round.scores) {
      roundScore += s.score;
      roundPutts += s.putts;
      totalHoles++;

      const strokesBeforePutt = s.score - s.putts;
      if (strokesBeforePutt <= s.par - 2) girCount++;

      if (s.par >= 4) {
        fairwayHoles++;
        if (s.fairway_result === "keep") fairwayKeepCount++;
      }
    }

    // 18H換算で正規化
    const holeCount = round.scores.length;
    if (holeCount > 0) {
      const factor = 18 / holeCount;
      normalizedScoreSum += roundScore * factor;
      normalizedPuttsSum += roundPutts * factor;
    }
  }

  return {
    avgScore: normalizedScoreSum / rounds.length,
    avgPutts: normalizedPuttsSum / rounds.length,
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

// コーススコアリングスタッツ
export interface CourseScoringStats {
  bounceBackRate: number;
  bogeyAvoidance: number;
  doubleBogeyAvoidance: number;
  par3Avg: number;
  par4Avg: number;
  par5Avg: number;
}

// コースパッティングスタッツ
export interface CoursePuttingStats {
  puttsPerGir: number;
  threePuttAvoidance: number;
  onePuttRate: number;
}

// コースショットスタッツ
export interface CourseShotStats {
  girFromFairway: number;
  girFromRough: number;
}

/**
 * コース別スコアリングスタッツを算出
 */
export function calculateCourseScoringStats(rounds: RoundScores[]): CourseScoringStats {
  const defaultStats: CourseScoringStats = {
    bounceBackRate: 0,
    bogeyAvoidance: 0,
    doubleBogeyAvoidance: 0,
    par3Avg: 0,
    par4Avg: 0,
    par5Avg: 0,
  };

  if (rounds.length === 0) return defaultStats;

  let totalHoles = 0;
  let bogeyOrWorseCount = 0;
  let doubleBogeyOrWorseCount = 0;
  let bounceBackOpportunities = 0;
  let bounceBackSuccess = 0;
  let par3Total = 0, par3Count = 0;
  let par4Total = 0, par4Count = 0;
  let par5Total = 0, par5Count = 0;

  for (const round of rounds) {
    const sorted = [...round.scores].sort((a, b) => a.hole_number - b.hole_number);

    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      totalHoles++;
      const overPar = s.score - s.par;

      if (overPar >= 1) bogeyOrWorseCount++;
      if (overPar >= 2) doubleBogeyOrWorseCount++;

      if (s.par === 3) { par3Total += s.score; par3Count++; }
      else if (s.par === 4) { par4Total += s.score; par4Count++; }
      else if (s.par === 5) { par5Total += s.score; par5Count++; }

      if (i > 0) {
        const prev = sorted[i - 1];
        if (prev.score - prev.par >= 1) {
          bounceBackOpportunities++;
          if (overPar <= 0) bounceBackSuccess++;
        }
      }
    }
  }

  return {
    bounceBackRate: bounceBackOpportunities > 0 ? (bounceBackSuccess / bounceBackOpportunities) * 100 : 0,
    bogeyAvoidance: totalHoles > 0 ? ((totalHoles - bogeyOrWorseCount) / totalHoles) * 100 : 0,
    doubleBogeyAvoidance: totalHoles > 0 ? ((totalHoles - doubleBogeyOrWorseCount) / totalHoles) * 100 : 0,
    par3Avg: par3Count > 0 ? par3Total / par3Count : 0,
    par4Avg: par4Count > 0 ? par4Total / par4Count : 0,
    par5Avg: par5Count > 0 ? par5Total / par5Count : 0,
  };
}

/**
 * コース別パッティングスタッツを算出
 */
export function calculateCoursePuttingStats(rounds: RoundScores[]): CoursePuttingStats {
  if (rounds.length === 0) return { puttsPerGir: 0, threePuttAvoidance: 0, onePuttRate: 0 };

  let totalHoles = 0;
  let puttsOnGir = 0;
  let girHoles = 0;
  let threePuttCount = 0;
  let onePuttCount = 0;

  for (const round of rounds) {
    for (const s of round.scores) {
      totalHoles++;
      const isGir = s.score - s.putts <= s.par - 2;
      if (isGir) {
        puttsOnGir += s.putts;
        girHoles++;
      }
      if (s.putts >= 3) threePuttCount++;
      if (s.putts === 1) onePuttCount++;
    }
  }

  return {
    puttsPerGir: girHoles > 0 ? puttsOnGir / girHoles : 0,
    threePuttAvoidance: totalHoles > 0 ? ((totalHoles - threePuttCount) / totalHoles) * 100 : 0,
    onePuttRate: totalHoles > 0 ? (onePuttCount / totalHoles) * 100 : 0,
  };
}

/**
 * コース別ショットスタッツ（GIR from FW/Rough）を算出
 */
export function calculateCourseShotStats(rounds: RoundScores[]): CourseShotStats {
  if (rounds.length === 0) return { girFromFairway: 0, girFromRough: 0 };

  let fwHoles = 0, girFromFw = 0;
  let roughHoles = 0, girFromRough = 0;

  for (const round of rounds) {
    for (const s of round.scores) {
      if (s.par < 4) continue;
      const isGir = s.score - s.putts <= s.par - 2;
      if (s.fairway_result === "keep") {
        fwHoles++;
        if (isGir) girFromFw++;
      } else if (s.fairway_result === "left" || s.fairway_result === "right") {
        roughHoles++;
        if (isGir) girFromRough++;
      }
    }
  }

  return {
    girFromFairway: fwHoles > 0 ? (girFromFw / fwHoles) * 100 : 0,
    girFromRough: roughHoles > 0 ? (girFromRough / roughHoles) * 100 : 0,
  };
}

/**
 * ティーショットのクラブ集計（shots_detailから）
 */
/**
 * ホール別のパーオン率
 */
export function calculateHoleGirRate(scores: ScoreRow[], holeNumber: number): { girRate: number; count: number } {
  const holeScores = scores.filter((s) => s.hole_number === holeNumber);
  if (holeScores.length === 0) return { girRate: 0, count: 0 };

  let girCount = 0;
  for (const s of holeScores) {
    const strokesBeforePutt = s.score - s.putts;
    if (strokesBeforePutt <= s.par - 2) girCount++;
  }

  return { girRate: (girCount / holeScores.length) * 100, count: holeScores.length };
}

/**
 * ホール別の平均パット数
 */
export function calculateHoleAvgPutts(scores: ScoreRow[], holeNumber: number): { avgPutts: number; count: number } {
  const holeScores = scores.filter((s) => s.hole_number === holeNumber);
  if (holeScores.length === 0) return { avgPutts: 0, count: 0 };

  const totalPutts = holeScores.reduce((sum, s) => sum + s.putts, 0);
  return { avgPutts: totalPutts / holeScores.length, count: holeScores.length };
}

/**
 * ホール別のスクランブル率（パーオンしなかったがパー以上で上がった率）
 */
export function calculateHoleScrambleRate(scores: ScoreRow[], holeNumber: number): { scrambleRate: number; opportunities: number } {
  const holeScores = scores.filter((s) => s.hole_number === holeNumber);
  let opportunities = 0;
  let successes = 0;

  for (const s of holeScores) {
    const strokesBeforePutt = s.score - s.putts;
    const isGir = strokesBeforePutt <= s.par - 2;
    if (!isGir) {
      opportunities++;
      if (s.score <= s.par) successes++;
    }
  }

  return {
    scrambleRate: opportunities > 0 ? (successes / opportunities) * 100 : 0,
    opportunities,
  };
}

/**
 * ホール別のスコア分布
 */
export function calculateHoleScoreDistribution(scores: ScoreRow[], holeNumber: number): ScoreDistribution {
  const holeScores = scores.filter((s) => s.hole_number === holeNumber);
  return calculateScoreDistribution(holeScores);
}

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
