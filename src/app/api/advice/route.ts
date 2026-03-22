import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MemberStats, DetailedMemberStats } from "@/types/database";
import { HoleAnalysis } from "@/utils/stats";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

/** 部内平均（全スタッツ） */
interface ClubAvgStats {
  avg_score: number;
  avg_putts: number;
  gir_rate: number;
  fairway_keep_rate: number;
  avg_birdies: number;
  scramble_rate: number;
  par3_avg: number;
  par4_avg: number;
  par5_avg: number;
  bounce_back_rate: number;
  bogey_avoidance: number;
  double_bogey_avoidance: number;
  putts_per_gir: number;
  three_putt_avoidance: number;
  one_putt_rate: number;
  gir_from_fairway: number;
  gir_from_rough: number;
}

interface AdviceRequest {
  stats: MemberStats;
  holeAnalysis: HoleAnalysis[];
  allStatsAvg: ClubAvgStats;
  detailedStats: DetailedMemberStats | null;
}

function fmt(v: number, d = 1): string {
  return v.toFixed(d);
}

function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

function fmtOpt(v: number | null, unit = ""): string {
  return v != null ? `${v.toFixed(1)}${unit}` : "データなし";
}

export async function POST(request: NextRequest) {
  try {
    const body: AdviceRequest = await request.json();
    const { stats, holeAnalysis, allStatsAvg, detailedStats } = body;
    const avg = allStatsAvg;

    // Build distance stats section
    let distanceSection = "";
    if (detailedStats) {
      const puttDist = detailedStats.make_pct_by_distance;
      const girDist = detailedStats.gir_by_distance;

      if (puttDist.length > 0) {
        distanceSection += "\n## パット距離別カップイン率\n";
        distanceSection += puttDist
          .map((d) => `- ${d.label}: ${fmtPct(d.rate)} (${d.count}回)`)
          .join("\n");
      }

      if (girDist.length > 0) {
        distanceSection += "\n\n## 距離別パーオン率\n";
        distanceSection += girDist
          .map((d) => `- ${d.label}: ${fmtPct(d.rate)} (${d.count}回)`)
          .join("\n");
      }
    }

    const prompt = `あなたはプロのゴルフコーチです。大学ゴルフ部員のスタッツを分析し、データに基づいた具体的な改善アドバイスを日本語で提供してください。

## コアスタッツ（直近10ラウンド平均）  ※括弧内は部内平均
- 平均スコア: ${fmt(stats.avg_score)} (${fmt(avg.avg_score)})
- 平均パット: ${fmt(stats.avg_putts)} (${fmt(avg.avg_putts)})
- パーオン率: ${fmtPct(stats.gir_rate)} (${fmtPct(avg.gir_rate)})
- FWキープ率: ${fmtPct(stats.fairway_keep_rate)} (${fmtPct(avg.fairway_keep_rate)})
- 平均バーディー数: ${fmt(stats.avg_birdies, 2)} (${fmt(avg.avg_birdies, 2)})
- リカバリー率: ${fmtPct(stats.scramble_rate)} (${fmtPct(avg.scramble_rate)})

## スコアリング
- Par3平均: ${fmt(stats.par3_avg)} (${fmt(avg.par3_avg)})
- Par4平均: ${fmt(stats.par4_avg)} (${fmt(avg.par4_avg)})
- Par5平均: ${fmt(stats.par5_avg)} (${fmt(avg.par5_avg)})
- バウンスバック率: ${fmtPct(stats.bounce_back_rate)} (${fmtPct(avg.bounce_back_rate)})
- ボギー回避率: ${fmtPct(stats.bogey_avoidance)} (${fmtPct(avg.bogey_avoidance)})
- ダボ回避率: ${fmtPct(stats.double_bogey_avoidance)} (${fmtPct(avg.double_bogey_avoidance)})

## パッティング
- パーオン時パット: ${fmt(stats.putts_per_gir)} (${fmt(avg.putts_per_gir)})
- 3パット回避率: ${fmtPct(stats.three_putt_avoidance)} (${fmtPct(avg.three_putt_avoidance)})
- 1パット率: ${fmtPct(stats.one_putt_rate)} (${fmtPct(avg.one_putt_rate)})

## ショット
- FWからのパーオン率: ${fmtPct(stats.gir_from_fairway)} (${fmtPct(avg.gir_from_fairway)})
- ラフからのパーオン率: ${fmtPct(stats.gir_from_rough)} (${fmtPct(avg.gir_from_rough)})
- サンドセーブ率: ${fmtOpt(stats.sand_save_rate, "%")}
- 平均飛距離: ${fmtOpt(stats.avg_driving_distance, "yd")}

## ホール別分析
${holeAnalysis.map((h) => `- ${h.parType}: 平均${h.avgScore.toFixed(2)}打 (Par比 ${h.avgOverPar >= 0 ? "+" : ""}${h.avgOverPar.toFixed(2)})`).join("\n")}
${distanceSection}

## 指示
上記の全データを部内平均と比較しながら分析してください。

1. **最優先の改善ポイント**を1つ特定し、なぜそれが最もスコアに影響するか数値を根拠に説明してください
2. その改善のための**具体的な練習メニュー**を2つ提案してください（ドリル名、回数、意識するポイント）
3. **強みとして伸ばすべき点**を1つ挙げ、その活かし方を提案してください
4. 距離別データがある場合は、**苦手な距離帯**への具体的なアプローチも提案してください

回答は400文字以内で、データの裏付けを示しながら簡潔にまとめてください。`;

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? "gemini-3.0-flash",
    });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const advice = response.text();

    return NextResponse.json({ advice });
  } catch (error) {
    console.error("Advice generation error:", error);
    return NextResponse.json({ error: "アドバイスの生成に失敗しました" }, { status: 500 });
  }
}
