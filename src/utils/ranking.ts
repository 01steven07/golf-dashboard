import { MemberStats } from "@/types/database";

interface RoundData {
  member_id: string;
  member_name: string;
  scores: {
    par: number;
    score: number;
    putts: number;
    fairway_result: string;
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
    let totalPar = 0;
    let totalPutts = 0;
    let totalHoles = 0;
    let girCount = 0;
    let fairwayKeepCount = 0;
    let fairwayHoles = 0; // Par 4, 5 only
    let birdieCount = 0;
    let scrambleOpportunities = 0;
    let scrambleSuccess = 0;

    for (const round of latestRounds) {
      for (const score of round.scores) {
        totalScore += score.score;
        totalPar += score.par;
        totalPutts += score.putts;
        totalHoles++;

        // GIR: パーオン = (par - 2) 打以内でグリーンに乗った
        // 推定: score - putts <= par - 2
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
      }
    }

    stats.push({
      member_id: memberId,
      member_name: data.name,
      round_count: roundCount,
      avg_score: totalScore / roundCount,
      avg_putts: totalPutts / roundCount,
      gir_rate: totalHoles > 0 ? (girCount / totalHoles) * 100 : 0,
      fairway_keep_rate: fairwayHoles > 0 ? (fairwayKeepCount / fairwayHoles) * 100 : 0,
      avg_birdies: birdieCount / roundCount,
      scramble_rate:
        scrambleOpportunities > 0 ? (scrambleSuccess / scrambleOpportunities) * 100 : 0,
    });
  }

  return stats;
}

export type RankingCategory = "gross" | "putt" | "gir" | "keep" | "birdie" | "scramble";

/**
 * カテゴリに応じてソートされたランキングを返す
 */
export function getRankedStats(
  stats: MemberStats[],
  category: RankingCategory
): MemberStats[] {
  const sorted = [...stats];

  switch (category) {
    case "gross":
      // Lower is better
      sorted.sort((a, b) => a.avg_score - b.avg_score);
      break;
    case "putt":
      // Lower is better
      sorted.sort((a, b) => a.avg_putts - b.avg_putts);
      break;
    case "gir":
      // Higher is better
      sorted.sort((a, b) => b.gir_rate - a.gir_rate);
      break;
    case "keep":
      // Higher is better
      sorted.sort((a, b) => b.fairway_keep_rate - a.fairway_keep_rate);
      break;
    case "birdie":
      // Higher is better
      sorted.sort((a, b) => b.avg_birdies - a.avg_birdies);
      break;
    case "scramble":
      // Higher is better
      sorted.sort((a, b) => b.scramble_rate - a.scramble_rate);
      break;
  }

  return sorted;
}

/**
 * カテゴリに応じた値を取得
 */
export function getStatValue(stat: MemberStats, category: RankingCategory): string {
  switch (category) {
    case "gross":
      return stat.avg_score.toFixed(1);
    case "putt":
      return stat.avg_putts.toFixed(1);
    case "gir":
      return `${stat.gir_rate.toFixed(1)}%`;
    case "keep":
      return `${stat.fairway_keep_rate.toFixed(1)}%`;
    case "birdie":
      return stat.avg_birdies.toFixed(2);
    case "scramble":
      return `${stat.scramble_rate.toFixed(1)}%`;
  }
}

/**
 * カテゴリの説明を取得
 */
export function getCategoryDescription(category: RankingCategory): string {
  switch (category) {
    case "gross":
      return "平均スコア";
    case "putt":
      return "平均パット数";
    case "gir":
      return "パーオン率";
    case "keep":
      return "フェアウェイキープ率";
    case "birdie":
      return "平均バーディー数";
    case "scramble":
      return "リカバリー率";
  }
}
