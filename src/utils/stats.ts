import { MemberStats } from "@/types/database";

export interface RadarChartData {
  category: string;
  value: number;
  fullMark: number;
}

/**
 * 偏差値を計算
 * (個人値 - 平均) / 標準偏差 * 10 + 50
 */
function calculateDeviation(value: number, mean: number, stdDev: number, inverse = false): number {
  if (stdDev === 0) return 50;
  const deviation = inverse
    ? ((mean - value) / stdDev) * 10 + 50
    : ((value - mean) / stdDev) * 10 + 50;
  // Clamp between 20-80
  return Math.max(20, Math.min(80, deviation));
}

/**
 * 標準偏差を計算
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map((value) => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * 個人のスタッツを部内の偏差値に変換してレーダーチャートデータを生成
 */
export function calculateRadarData(
  myStats: MemberStats,
  allStats: MemberStats[]
): RadarChartData[] {
  const scores = allStats.map((s) => s.avg_score);
  const putts = allStats.map((s) => s.avg_putts);
  const girs = allStats.map((s) => s.gir_rate);
  const keeps = allStats.map((s) => s.fairway_keep_rate);
  const scrambles = allStats.map((s) => s.scramble_rate);

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const avgPutt = putts.reduce((a, b) => a + b, 0) / putts.length;
  const avgGir = girs.reduce((a, b) => a + b, 0) / girs.length;
  const avgKeep = keeps.reduce((a, b) => a + b, 0) / keeps.length;
  const avgScramble = scrambles.reduce((a, b) => a + b, 0) / scrambles.length;

  return [
    {
      category: "スコア",
      value: calculateDeviation(myStats.avg_score, avgScore, calculateStdDev(scores), true),
      fullMark: 80,
    },
    {
      category: "パット",
      value: calculateDeviation(myStats.avg_putts, avgPutt, calculateStdDev(putts), true),
      fullMark: 80,
    },
    {
      category: "GIR",
      value: calculateDeviation(myStats.gir_rate, avgGir, calculateStdDev(girs)),
      fullMark: 80,
    },
    {
      category: "FWキープ",
      value: calculateDeviation(myStats.fairway_keep_rate, avgKeep, calculateStdDev(keeps)),
      fullMark: 80,
    },
    {
      category: "リカバリー",
      value: calculateDeviation(myStats.scramble_rate, avgScramble, calculateStdDev(scrambles)),
      fullMark: 80,
    },
  ];
}

export interface HoleAnalysis {
  parType: string;
  avgScore: number;
  avgOverPar: number;
  count: number;
}

/**
 * ホール別分析データを生成
 */
export function calculateHoleAnalysis(
  scores: { par: number; score: number }[]
): HoleAnalysis[] {
  const par3 = scores.filter((s) => s.par === 3);
  const par4 = scores.filter((s) => s.par === 4);
  const par5 = scores.filter((s) => s.par === 5);

  const calcAvg = (holes: { par: number; score: number }[]) => {
    if (holes.length === 0) return { avgScore: 0, avgOverPar: 0, count: 0 };
    const totalScore = holes.reduce((sum, h) => sum + h.score, 0);
    const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
    return {
      avgScore: totalScore / holes.length,
      avgOverPar: (totalScore - totalPar) / holes.length,
      count: holes.length,
    };
  };

  return [
    { parType: "Par 3", ...calcAvg(par3) },
    { parType: "Par 4", ...calcAvg(par4) },
    { parType: "Par 5", ...calcAvg(par5) },
  ];
}
