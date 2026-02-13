import { MemberStats, DetailedMemberStats, DistanceBucket } from "@/types/database";
import { STAT_DEFINITIONS, formatStatValue, getStatDefinition } from "@/utils/stat-definitions";

export interface RoundData {
  member_id: string;
  member_name: string;
  scores: {
    hole_number: number;
    par: number;
    score: number;
    putts: number;
    fairway_result: string;
    distance?: number | null;
    shots_detail?: unknown[] | null;
  }[];
}

/**
 * 直近5ラウンドのデータから各部員のスタッツを計算する
 */
export function calculateMemberStats(rounds: RoundData[]): MemberStats[] {
  // Group rounds by member
  const memberRounds = new Map<string, { name: string; rounds: RoundData[] }>();

  for (const round of rounds) {
    const existing = memberRounds.get(round.member_id);
    if (existing) {
      existing.rounds.push(round);
    } else {
      memberRounds.set(round.member_id, {
        name: round.member_name,
        rounds: [round],
      });
    }
  }

  const stats: MemberStats[] = [];

  for (const [memberId, data] of memberRounds) {
    // Take only latest 5 rounds
    const latestRounds = data.rounds.slice(0, 5);
    const roundCount = latestRounds.length;

    if (roundCount === 0) continue;

    let totalScore = 0;
    let totalPutts = 0;
    let totalHoles = 0;
    let girCount = 0;
    let fairwayKeepCount = 0;
    let fairwayHoles = 0; // Par 4, 5 only
    let birdieCount = 0;
    let scrambleOpportunities = 0;
    let scrambleSuccess = 0;

    // New counters for extended stats
    let par3Total = 0;
    let par3Count = 0;
    let par4Total = 0;
    let par4Count = 0;
    let par5Total = 0;
    let par5Count = 0;

    let bogeyOrWorseCount = 0;
    let doubleBogeyOrWorseCount = 0;

    let puttsOnGir = 0;
    let girHolesForPutts = 0;
    let threePuttCount = 0;
    let onePuttCount = 0;

    // GIR from fairway / rough (for Par 4+)
    let girFromFairwayCount = 0;
    let fairwayApproachHoles = 0;
    let girFromRoughCount = 0;
    let roughApproachHoles = 0;

    // Bounce back: ボギー以上の次ホールでパー以下
    let bounceBackOpportunities = 0;
    let bounceBackSuccess = 0;

    // Sand save & driving distance (shots_detail dependent)
    let sandSaveOpportunities = 0;
    let sandSaveSuccess = 0;
    let drivingDistanceTotal = 0;
    let drivingDistanceCount = 0;

    for (const round of latestRounds) {
      // Sort scores by hole_number for bounce back calculation
      const sortedScores = [...round.scores].sort(
        (a, b) => a.hole_number - b.hole_number
      );

      for (let i = 0; i < sortedScores.length; i++) {
        const score = sortedScores[i];
        totalScore += score.score;
        totalPutts += score.putts;
        totalHoles++;

        // GIR: パーオン = (par - 2) 打以内でグリーンに乗った
        const strokesBeforePutt = score.score - score.putts;
        const isGir = strokesBeforePutt <= score.par - 2;
        if (isGir) girCount++;

        // Fairway Keep: Par 4, 5 のみ対象
        if (score.par >= 4) {
          fairwayHoles++;
          if (score.fairway_result === "keep") {
            fairwayKeepCount++;
          }
        }

        // Birdie
        if (score.score < score.par) {
          birdieCount++;
        }

        // Scramble: パーオンしなかったがパー以上で上がった
        if (!isGir) {
          scrambleOpportunities++;
          if (score.score <= score.par) {
            scrambleSuccess++;
          }
        }

        // Par別平均
        if (score.par === 3) {
          par3Total += score.score;
          par3Count++;
        } else if (score.par === 4) {
          par4Total += score.score;
          par4Count++;
        } else if (score.par === 5) {
          par5Total += score.score;
          par5Count++;
        }

        // ボギー/ダボ回避
        const overPar = score.score - score.par;
        if (overPar >= 1) bogeyOrWorseCount++;
        if (overPar >= 2) doubleBogeyOrWorseCount++;

        // パッティング詳細
        if (isGir) {
          puttsOnGir += score.putts;
          girHolesForPutts++;
        }
        if (score.putts >= 3) threePuttCount++;
        if (score.putts === 1) onePuttCount++;

        // GIR from FW / Rough (Par 4+ のみ)
        if (score.par >= 4) {
          if (score.fairway_result === "keep") {
            fairwayApproachHoles++;
            if (isGir) girFromFairwayCount++;
          } else if (
            score.fairway_result === "left" ||
            score.fairway_result === "right"
          ) {
            roughApproachHoles++;
            if (isGir) girFromRoughCount++;
          }
        }

        // バウンスバック: 前のホールがボギー以上で、今のホールがパー以下
        if (i > 0) {
          const prevScore = sortedScores[i - 1];
          const prevOverPar = prevScore.score - prevScore.par;
          if (prevOverPar >= 1) {
            bounceBackOpportunities++;
            if (overPar <= 0) {
              bounceBackSuccess++;
            }
          }
        }

        // shots_detail dependent: サンドセーブ & 飛距離
        const shots = parseShots(score.shots_detail ?? null);
        if (shots.length > 0) {
          const approachShots = shots.filter(
            (s): s is ParsedApproachShot => s.type === "approach"
          );

          // Sand save
          const hasGreensideBunker = approachShots.some(
            (s) => (s.lie === "left-bunker" || s.lie === "right-bunker") && s.distance <= 50
          );
          if (hasGreensideBunker) {
            sandSaveOpportunities++;
            if (score.score <= score.par) sandSaveSuccess++;
          }

          // Driving distance (Par 4 only)
          if (score.par === 4 && score.distance) {
            const firstApproach = approachShots[0];
            if (firstApproach && firstApproach.distance > 0) {
              const estimatedDrive = score.distance - firstApproach.distance;
              if (estimatedDrive > 50 && estimatedDrive < 400) {
                drivingDistanceTotal += estimatedDrive;
                drivingDistanceCount++;
              }
            }
          }
        }
      }
    }

    stats.push({
      member_id: memberId,
      member_name: data.name,
      round_count: roundCount,
      // Core
      avg_score: totalScore / roundCount,
      avg_putts: totalPutts / roundCount,
      gir_rate: totalHoles > 0 ? (girCount / totalHoles) * 100 : 0,
      fairway_keep_rate:
        fairwayHoles > 0 ? (fairwayKeepCount / fairwayHoles) * 100 : 0,
      avg_birdies: birdieCount / roundCount,
      scramble_rate:
        scrambleOpportunities > 0
          ? (scrambleSuccess / scrambleOpportunities) * 100
          : 0,
      // Scoring
      par3_avg: par3Count > 0 ? par3Total / par3Count : 0,
      par4_avg: par4Count > 0 ? par4Total / par4Count : 0,
      par5_avg: par5Count > 0 ? par5Total / par5Count : 0,
      bounce_back_rate:
        bounceBackOpportunities > 0
          ? (bounceBackSuccess / bounceBackOpportunities) * 100
          : 0,
      bogey_avoidance:
        totalHoles > 0
          ? ((totalHoles - bogeyOrWorseCount) / totalHoles) * 100
          : 0,
      double_bogey_avoidance:
        totalHoles > 0
          ? ((totalHoles - doubleBogeyOrWorseCount) / totalHoles) * 100
          : 0,
      // Putting
      putts_per_gir: girHolesForPutts > 0 ? puttsOnGir / girHolesForPutts : 0,
      three_putt_avoidance:
        totalHoles > 0
          ? ((totalHoles - threePuttCount) / totalHoles) * 100
          : 0,
      one_putt_rate:
        totalHoles > 0 ? (onePuttCount / totalHoles) * 100 : 0,
      // Shot
      gir_from_fairway:
        fairwayApproachHoles > 0
          ? (girFromFairwayCount / fairwayApproachHoles) * 100
          : 0,
      gir_from_rough:
        roughApproachHoles > 0
          ? (girFromRoughCount / roughApproachHoles) * 100
          : 0,
      sand_save_rate:
        sandSaveOpportunities > 0
          ? (sandSaveSuccess / sandSaveOpportunities) * 100
          : null,
      avg_driving_distance:
        drivingDistanceCount > 0
          ? drivingDistanceTotal / drivingDistanceCount
          : null,
    });
  }

  return stats;
}

export type RankingCategory =
  | "gross"
  | "putt"
  | "gir"
  | "keep"
  | "birdie"
  | "scramble"
  | "par3_avg"
  | "par4_avg"
  | "par5_avg"
  | "bounce_back"
  | "bogey_avoidance"
  | "double_bogey_avoidance"
  | "putts_per_gir"
  | "three_putt_avoidance"
  | "one_putt_rate"
  | "gir_from_fairway"
  | "gir_from_rough"
  | "sand_save"
  | "driving_distance";

/** MemberStatsからカテゴリに対応する数値を取得 */
export function getStatNumericValue(
  stat: MemberStats,
  category: RankingCategory
): number {
  switch (category) {
    case "gross":
      return stat.avg_score;
    case "putt":
      return stat.avg_putts;
    case "gir":
      return stat.gir_rate;
    case "keep":
      return stat.fairway_keep_rate;
    case "birdie":
      return stat.avg_birdies;
    case "scramble":
      return stat.scramble_rate;
    case "par3_avg":
      return stat.par3_avg;
    case "par4_avg":
      return stat.par4_avg;
    case "par5_avg":
      return stat.par5_avg;
    case "bounce_back":
      return stat.bounce_back_rate;
    case "bogey_avoidance":
      return stat.bogey_avoidance;
    case "double_bogey_avoidance":
      return stat.double_bogey_avoidance;
    case "putts_per_gir":
      return stat.putts_per_gir;
    case "three_putt_avoidance":
      return stat.three_putt_avoidance;
    case "one_putt_rate":
      return stat.one_putt_rate;
    case "gir_from_fairway":
      return stat.gir_from_fairway;
    case "gir_from_rough":
      return stat.gir_from_rough;
    case "sand_save":
      return stat.sand_save_rate ?? 0;
    case "driving_distance":
      return stat.avg_driving_distance ?? 0;
  }
}

/** requiresDetail なカテゴリで、データがない部員かどうか */
function hasDetailData(stat: MemberStats, category: RankingCategory): boolean {
  if (category === "sand_save") return stat.sand_save_rate !== null;
  if (category === "driving_distance") return stat.avg_driving_distance !== null;
  return true;
}

/**
 * カテゴリに応じてソートされたランキングを返す
 */
export function getRankedStats(
  stats: MemberStats[],
  category: RankingCategory
): MemberStats[] {
  const def = getStatDefinition(category);
  // requiresDetail なカテゴリはデータがある部員のみ対象
  const filtered = def?.requiresDetail
    ? stats.filter((s) => hasDetailData(s, category))
    : stats;
  const sorted = [...filtered];

  sorted.sort((a, b) => {
    const aVal = getStatNumericValue(a, category);
    const bVal = getStatNumericValue(b, category);
    return def?.lowerIsBetter ? aVal - bVal : bVal - aVal;
  });

  return sorted;
}

/**
 * カテゴリに応じた値を取得
 */
export function getStatValue(
  stat: MemberStats,
  category: RankingCategory
): string {
  const def = getStatDefinition(category);
  if (!def) return "-";
  if (def.requiresDetail && !hasDetailData(stat, category)) return "-";
  const value = getStatNumericValue(stat, category);
  if (category === "driving_distance") {
    return value > 0 ? `${value.toFixed(0)}yd` : "-";
  }
  return formatStatValue(value, def.format);
}

/**
 * カテゴリの説明を取得
 */
export function getCategoryDescription(category: RankingCategory): string {
  const def = STAT_DEFINITIONS.find((d) => d.key === category);
  return def?.description ?? "";
}

/** ラウンドデータ（詳細スタッツ計算用、distance + shots_detail含む） */
export interface DetailedRoundData {
  member_id: string;
  scores: {
    hole_number: number;
    par: number;
    score: number;
    putts: number;
    distance: number | null;
    shots_detail: unknown[] | null;
  }[];
}

interface ParsedPuttShot {
  type: "putt";
  distance: number;
  result: string;
}

interface ParsedApproachShot {
  type: "approach";
  distance: number;
  lie: string;
}

interface ParsedTeeShot {
  type: "tee";
}

type ParsedShot = ParsedPuttShot | ParsedApproachShot | ParsedTeeShot;

function parseShots(shotsDetail: unknown[] | null): ParsedShot[] {
  if (!shotsDetail || !Array.isArray(shotsDetail)) return [];
  return shotsDetail.filter((item): item is ParsedShot => {
    if (typeof item !== "object" || item === null) return false;
    const obj = item as Record<string, unknown>;
    return obj.type === "tee" || obj.type === "approach" || obj.type === "putt";
  });
}

const PUTT_DISTANCE_BUCKETS = [
  { label: "~3ft", min: 0, max: 3 },
  { label: "3-5ft", min: 3, max: 5 },
  { label: "5-10ft", min: 5, max: 10 },
  { label: "10-15ft", min: 10, max: 15 },
  { label: "15ft+", min: 15, max: Infinity },
];

const GIR_DISTANCE_BUCKETS = [
  { label: "~100yd", min: 0, max: 100 },
  { label: "100-125", min: 100, max: 125 },
  { label: "125-150", min: 125, max: 150 },
  { label: "150-175", min: 150, max: 175 },
  { label: "175-200", min: 175, max: 200 },
  { label: "200yd+", min: 200, max: Infinity },
];

/**
 * shots_detail依存の詳細スタッツを計算
 */
export function calculateDetailedStats(rounds: DetailedRoundData[]): DetailedMemberStats {
  let sandSaveOpportunities = 0;
  let sandSaveSuccess = 0;
  let drivingDistanceTotal = 0;
  let drivingDistanceCount = 0;

  // Putt make % by distance
  const puttBuckets = PUTT_DISTANCE_BUCKETS.map((b) => ({ ...b, attempts: 0, makes: 0 }));

  // GIR by approach distance
  const girBuckets = GIR_DISTANCE_BUCKETS.map((b) => ({ ...b, attempts: 0, girs: 0 }));

  for (const round of rounds) {
    for (const score of round.scores) {
      const shots = parseShots(score.shots_detail);
      if (shots.length === 0) continue;

      // Sand save: approach shot from bunker near the green, then check if par or better
      const approachShots = shots.filter(
        (s): s is ParsedApproachShot => s.type === "approach"
      );
      const hasGreensideBunker = approachShots.some(
        (s) => (s.lie === "left-bunker" || s.lie === "right-bunker") && s.distance <= 50
      );
      if (hasGreensideBunker) {
        sandSaveOpportunities++;
        if (score.score <= score.par) {
          sandSaveSuccess++;
        }
      }

      // Driving distance: Par 4 only, use hole distance - first approach distance
      if (score.par === 4 && score.distance) {
        const firstApproach = approachShots[0];
        if (firstApproach && firstApproach.distance > 0) {
          const estimatedDrive = score.distance - firstApproach.distance;
          if (estimatedDrive > 50 && estimatedDrive < 400) {
            drivingDistanceTotal += estimatedDrive;
            drivingDistanceCount++;
          }
        }
      }

      // Putt make % by distance: each putt shot
      const puttShots = shots.filter(
        (s): s is ParsedPuttShot => s.type === "putt"
      );
      for (const putt of puttShots) {
        if (putt.distance <= 0) continue;
        for (const bucket of puttBuckets) {
          if (putt.distance > bucket.min && putt.distance <= bucket.max) {
            bucket.attempts++;
            if (putt.result === "in") {
              bucket.makes++;
            }
            break;
          }
        }
      }

      // GIR by approach distance: last approach before green
      if (approachShots.length > 0) {
        const lastApproach = approachShots[approachShots.length - 1];
        if (lastApproach.distance > 0) {
          const isGir = score.score - score.putts <= score.par - 2;
          for (const bucket of girBuckets) {
            if (lastApproach.distance > bucket.min && lastApproach.distance <= bucket.max) {
              bucket.attempts++;
              if (isGir) bucket.girs++;
              break;
            }
          }
        }
      }
    }
  }

  const makePctByDistance: DistanceBucket[] = puttBuckets
    .filter((b) => b.attempts > 0)
    .map((b) => ({
      label: b.label,
      rate: (b.makes / b.attempts) * 100,
      count: b.attempts,
    }));

  const girByDistance: DistanceBucket[] = girBuckets
    .filter((b) => b.attempts > 0)
    .map((b) => ({
      label: b.label,
      rate: (b.girs / b.attempts) * 100,
      count: b.attempts,
    }));

  return {
    sand_save_rate: sandSaveOpportunities > 0
      ? (sandSaveSuccess / sandSaveOpportunities) * 100
      : null,
    avg_driving_distance: drivingDistanceCount > 0
      ? drivingDistanceTotal / drivingDistanceCount
      : null,
    make_pct_by_distance: makePctByDistance,
    gir_by_distance: girByDistance,
  };
}
