import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MemberStats } from "@/types/database";
import { HoleAnalysis } from "@/utils/stats";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

interface AdviceRequest {
  stats: MemberStats;
  holeAnalysis: HoleAnalysis[];
  allStatsAvg: {
    avg_score: number;
    avg_putts: number;
    gir_rate: number;
    fairway_keep_rate: number;
    scramble_rate: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AdviceRequest = await request.json();
    const { stats, holeAnalysis, allStatsAvg } = body;

    const prompt = `あなたはプロのゴルフコーチです。以下のプレイヤーのスタッツを分析し、具体的な改善アドバイスを日本語で提供してください。

## プレイヤーのスタッツ（直近5ラウンド平均）
- 平均スコア: ${stats.avg_score.toFixed(1)} (部内平均: ${allStatsAvg.avg_score.toFixed(1)})
- 平均パット: ${stats.avg_putts.toFixed(1)} (部内平均: ${allStatsAvg.avg_putts.toFixed(1)})
- パーオン率: ${stats.gir_rate.toFixed(1)}% (部内平均: ${allStatsAvg.gir_rate.toFixed(1)}%)
- FWキープ率: ${stats.fairway_keep_rate.toFixed(1)}% (部内平均: ${allStatsAvg.fairway_keep_rate.toFixed(1)}%)
- リカバリー率: ${stats.scramble_rate.toFixed(1)}% (部内平均: ${allStatsAvg.scramble_rate.toFixed(1)}%)

## ホール別分析
${holeAnalysis.map((h) => `- ${h.parType}: 平均${h.avgScore.toFixed(2)}打 (Par比 ${h.avgOverPar >= 0 ? "+" : ""}${h.avgOverPar.toFixed(2)})`).join("\n")}

## 指示
1. このプレイヤーの最も改善すべき点を1つ特定してください
2. その改善のための具体的な練習方法を2つ提案してください
3. 強みとして伸ばすべき点を1つ挙げてください

回答は300文字以内で、励ましの言葉を添えて簡潔にまとめてください。`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const advice = response.text();

    return NextResponse.json({ advice });
  } catch (error) {
    console.error("Advice generation error:", error);
    return NextResponse.json(
      { error: "アドバイスの生成に失敗しました" },
      { status: 500 }
    );
  }
}
