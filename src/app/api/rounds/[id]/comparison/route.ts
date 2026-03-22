import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/api-auth";

interface ScoreRow {
  hole_number: number;
  par: number;
  score: number;
  putts: number;
  fairway_result: string;
  ob: number;
}

interface StatsValues {
  avg_score: number;
  avg_putts: number;
  gir_rate: number;
  fairway_keep_rate: number;
  scramble_rate: number;
  birdie_count: number;
  par3_avg: number;
  par4_avg: number;
  par5_avg: number;
  bogey_avoidance: number;
  double_bogey_avoidance: number;
  putts_per_gir: number;
  three_putt_avoidance: number;
  one_putt_rate: number;
  gir_from_fairway: number;
  gir_from_rough: number;
  bounce_back_rate: number;
  ob_count: number;
}

interface ComparisonResult {
  avg: StatsValues;
  rankings: Record<string, { rank: number; total: number }>;
  member_count?: number;
  round_count?: number;
}

/** lowerIsBetter なスタッツキー */
const LOWER_IS_BETTER = new Set([
  "avg_score",
  "avg_putts",
  "par3_avg",
  "par4_avg",
  "par5_avg",
  "putts_per_gir",
  "ob_count",
]);

function calcStatsForOneRound(scores: ScoreRow[]): StatsValues {
  const sorted = [...scores].sort((a, b) => a.hole_number - b.hole_number);
  const totalHoles = sorted.length;
  if (totalHoles === 0) {
    return {
      avg_score: 0,
      avg_putts: 0,
      gir_rate: 0,
      fairway_keep_rate: 0,
      scramble_rate: 0,
      birdie_count: 0,
      par3_avg: 0,
      par4_avg: 0,
      par5_avg: 0,
      bogey_avoidance: 0,
      double_bogey_avoidance: 0,
      putts_per_gir: 0,
      three_putt_avoidance: 0,
      one_putt_rate: 0,
      gir_from_fairway: 0,
      gir_from_rough: 0,
      bounce_back_rate: 0,
      ob_count: 0,
    };
  }

  let totalScore = 0,
    totalPutts = 0,
    obCount = 0;
  let girCount = 0,
    fwKeep = 0,
    fwHoles = 0;
  let scrambleOpp = 0,
    scrambleOk = 0,
    birdies = 0;
  let p3t = 0,
    p3c = 0,
    p4t = 0,
    p4c = 0,
    p5t = 0,
    p5c = 0;
  let bogeyPlus = 0,
    dbPlus = 0;
  let puttsGir = 0,
    girH = 0,
    tp = 0,
    op = 0;
  let girFw = 0,
    fwApp = 0,
    girRo = 0,
    roApp = 0;
  let bbOpp = 0,
    bbOk = 0;

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    totalScore += s.score;
    totalPutts += s.putts;
    obCount += s.ob;
    const diff = s.score - s.par;
    const isGir = s.score - s.putts <= s.par - 2;
    if (isGir) girCount++;
    if (diff < 0) birdies++;
    if (diff >= 1) bogeyPlus++;
    if (diff >= 2) dbPlus++;
    if (s.par >= 4) {
      fwHoles++;
      if (s.fairway_result === "keep") fwKeep++;
    }
    if (!isGir) {
      scrambleOpp++;
      if (s.score <= s.par) scrambleOk++;
    }
    if (s.par === 3) {
      p3t += s.score;
      p3c++;
    } else if (s.par === 4) {
      p4t += s.score;
      p4c++;
    } else if (s.par === 5) {
      p5t += s.score;
      p5c++;
    }
    if (isGir) {
      puttsGir += s.putts;
      girH++;
    }
    if (s.putts >= 3) tp++;
    if (s.putts === 1) op++;
    if (s.par >= 4) {
      if (s.fairway_result === "keep") {
        fwApp++;
        if (isGir) girFw++;
      } else if (s.fairway_result === "left" || s.fairway_result === "right") {
        roApp++;
        if (isGir) girRo++;
      }
    }
    if (i > 0) {
      const prev = sorted[i - 1];
      if (prev.score - prev.par >= 1) {
        bbOpp++;
        if (diff <= 0) bbOk++;
      }
    }
  }

  const factor = 18 / totalHoles;
  return {
    avg_score: totalScore * factor,
    avg_putts: totalPutts * factor,
    gir_rate: totalHoles > 0 ? (girCount / totalHoles) * 100 : 0,
    fairway_keep_rate: fwHoles > 0 ? (fwKeep / fwHoles) * 100 : 0,
    scramble_rate: scrambleOpp > 0 ? (scrambleOk / scrambleOpp) * 100 : 0,
    birdie_count: birdies * factor,
    par3_avg: p3c > 0 ? p3t / p3c : 0,
    par4_avg: p4c > 0 ? p4t / p4c : 0,
    par5_avg: p5c > 0 ? p5t / p5c : 0,
    bogey_avoidance: totalHoles > 0 ? ((totalHoles - bogeyPlus) / totalHoles) * 100 : 0,
    double_bogey_avoidance: totalHoles > 0 ? ((totalHoles - dbPlus) / totalHoles) * 100 : 0,
    putts_per_gir: girH > 0 ? puttsGir / girH : 0,
    three_putt_avoidance: totalHoles > 0 ? ((totalHoles - tp) / totalHoles) * 100 : 0,
    one_putt_rate: totalHoles > 0 ? (op / totalHoles) * 100 : 0,
    gir_from_fairway: fwApp > 0 ? (girFw / fwApp) * 100 : 0,
    gir_from_rough: roApp > 0 ? (girRo / roApp) * 100 : 0,
    bounce_back_rate: bbOpp > 0 ? (bbOk / bbOpp) * 100 : 0,
    ob_count: obCount * factor,
  };
}

function calcAverageStats(allStats: StatsValues[]): StatsValues {
  const n = allStats.length;
  if (n === 0) return calcStatsForOneRound([]);

  const keys = Object.keys(allStats[0]) as (keyof StatsValues)[];
  const result: Record<string, number> = {};
  for (const key of keys) {
    result[key] = allStats.reduce((s, st) => s + st[key], 0) / n;
  }
  return result as unknown as StatsValues;
}

/** myStatsの各スタッツについて、allStatsGroupの中での順位を算出 */
function calcRankings(
  myStats: StatsValues,
  allStatsGroup: StatsValues[]
): Record<string, { rank: number; total: number }> {
  const total = allStatsGroup.length;
  const rankings: Record<string, { rank: number; total: number }> = {};
  const keys = Object.keys(myStats) as (keyof StatsValues)[];

  for (const key of keys) {
    const myVal = myStats[key];
    const lowerBetter = LOWER_IS_BETTER.has(key);
    let rank = 1;
    for (const other of allStatsGroup) {
      if (lowerBetter) {
        if (other[key] < myVal) rank++;
      } else {
        if (other[key] > myVal) rank++;
      }
    }
    rankings[key] = { rank, total };
  }

  return rankings;
}

// GET: ラウンドの比較データを取得
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id: roundId } = await params;

    // 対象ラウンドの情報取得
    const { data: round, error: roundError } = await supabase
      .from("rounds")
      .select(
        "id, member_id, course_id, date, scores(hole_number, par, score, putts, fairway_result, ob)"
      )
      .eq("id", roundId)
      .single();

    if (roundError || !round) {
      return NextResponse.json({ error: "ラウンドが見つかりません" }, { status: 404 });
    }

    const myScores = (round.scores as unknown as ScoreRow[]) ?? [];
    const myStats = calcStatsForOneRound(myScores);

    // 3つの比較データを並列取得
    const [sameDayResult, clubAvgResult, selfAvgResult] = await Promise.all([
      // 1. 同日同コースの全部員（自分含む）
      supabase
        .from("rounds")
        .select("id, member_id, scores(hole_number, par, score, putts, fairway_result, ob)")
        .eq("course_id", round.course_id)
        .eq("date", round.date),

      // 2. 全部員の直近ラウンド（最新200件から）
      supabase
        .from("rounds")
        .select("id, member_id, scores(hole_number, par, score, putts, fairway_result, ob)")
        .order("date", { ascending: false })
        .limit(200),

      // 3. 自分の直近10ラウンド（今回含む）
      supabase
        .from("rounds")
        .select("id, member_id, scores(hole_number, par, score, putts, fairway_result, ob)")
        .eq("member_id", round.member_id)
        .order("date", { ascending: false })
        .limit(11),
    ]);

    // --- 同日同コース ---
    let sameDay: ComparisonResult | null = null;
    if (sameDayResult.data && sameDayResult.data.length > 1) {
      const others = sameDayResult.data.filter((r) => r.id !== roundId);
      const otherStatsList = others.map((r) =>
        calcStatsForOneRound((r.scores as unknown as ScoreRow[]) ?? [])
      );
      // ランキングは全員分（自分含む）
      const allStatsList = [myStats, ...otherStatsList];
      sameDay = {
        avg: calcAverageStats(otherStatsList),
        rankings: calcRankings(myStats, allStatsList),
        member_count: sameDayResult.data.length,
      };
    }

    // --- 部全体平均（今回のラウンドを除外） ---
    let clubAvg: ComparisonResult | null = null;
    if (clubAvgResult.data && clubAvgResult.data.length > 0) {
      // メンバーごとに直近10ラウンドの平均を算出（今回のラウンドは除外）
      const memberRounds = new Map<string, ScoreRow[][]>();
      for (const r of clubAvgResult.data) {
        if (r.id === roundId) continue; // 今回のラウンドを除外
        const scores = (r.scores as unknown as ScoreRow[]) ?? [];
        if (scores.length === 0) continue;
        const existing = memberRounds.get(r.member_id) ?? [];
        if (existing.length < 10) {
          existing.push(scores);
          memberRounds.set(r.member_id, existing);
        }
      }
      // 各メンバーの平均スタッツ
      const memberAvgs: StatsValues[] = [];
      for (const rounds of memberRounds.values()) {
        const roundStats = rounds.map((s) => calcStatsForOneRound(s));
        memberAvgs.push(calcAverageStats(roundStats));
      }
      if (memberAvgs.length > 0) {
        // 全体平均
        const overallAvg = calcAverageStats(memberAvgs);
        // ランキング: このラウンドのスタッツを各メンバー平均と比較
        const rankings = calcRankings(myStats, memberAvgs);
        clubAvg = {
          avg: overallAvg,
          rankings,
          member_count: memberRounds.size,
          round_count: clubAvgResult.data.filter((r) => r.id !== roundId).length,
        };
      }
    }

    // --- 自分平均 ---
    let selfAvg: ComparisonResult | null = null;
    if (selfAvgResult.data && selfAvgResult.data.length > 1) {
      const otherRounds = selfAvgResult.data.filter((r) => r.id !== roundId).slice(0, 10);
      if (otherRounds.length > 0) {
        const otherStatsList = otherRounds.map((r) =>
          calcStatsForOneRound((r.scores as unknown as ScoreRow[]) ?? [])
        );
        const allStatsList = [myStats, ...otherStatsList];
        selfAvg = {
          avg: calcAverageStats(otherStatsList),
          rankings: calcRankings(myStats, allStatsList),
          round_count: allStatsList.length,
        };
      }
    }

    return NextResponse.json({ sameDay, clubAvg, selfAvg });
  } catch (error) {
    console.error("Comparison data error:", error);
    return NextResponse.json({ error: "比較データの取得に失敗しました" }, { status: 500 });
  }
}
