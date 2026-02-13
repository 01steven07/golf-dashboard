import { MemberStats } from "@/types/database";
import { RankingCategory, getRankedStats, getStatNumericValue } from "@/utils/ranking";
import { formatStatValue, getStatDefinition } from "@/utils/stat-definitions";

export interface ClubComparison {
  clubAvg: string;
  rank: number;
  totalMembers: number;
}

/**
 * 部内平均と自分の順位を計算する
 */
export function getClubComparison(
  allStats: MemberStats[],
  myMemberId: string,
  category: RankingCategory
): ClubComparison | null {
  if (allStats.length === 0) return null;

  const def = getStatDefinition(category);
  if (!def) return null;

  // 部内平均を計算
  const values = allStats.map((s) => getStatNumericValue(s, category));
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

  // フォーマット
  let clubAvg: string;
  if (category === "driving_distance") {
    clubAvg = avg > 0 ? `${avg.toFixed(0)}yd` : "-";
  } else {
    clubAvg = formatStatValue(avg, def.format);
  }

  // ランキング順位を算出
  const ranked = getRankedStats(allStats, category);
  const rank = ranked.findIndex((s) => s.member_id === myMemberId) + 1;

  if (rank === 0) return null;

  return {
    clubAvg,
    rank,
    totalMembers: ranked.length,
  };
}
