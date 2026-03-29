import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth, isAuthError } from "@/lib/api-auth";
import { supabase } from "@/lib/supabase";
import { Score } from "@/types/database";
import { Shot } from "@/types/shot";
import { calculateSingleRoundStats } from "@/utils/single-round-stats";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

function fmt(v: number, d = 1): string {
  return v.toFixed(d);
}

function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

interface ClubCategoryRating {
  category: string;
  avgRating: number;
  count: number;
}

function getClubCategory(club: string): string | null {
  if (club === "1W") return "ドライバー";
  if (["3W", "5W", "7W"].includes(club)) return "ウッド";
  if (club.startsWith("UT")) return "UT";
  if (/^\d+I$/.test(club) || club === "PW") return "アイアン";
  if (/^\d{2}$/.test(club)) return "ウェッジ";
  if (club === "PT") return "パター";
  return null;
}

function calcClubRatings(scores: Score[]): ClubCategoryRating[] {
  const map = new Map<string, { total: number; count: number }>();

  for (const score of scores) {
    if (!score.shots_detail || !Array.isArray(score.shots_detail)) continue;
    for (const raw of score.shots_detail) {
      const shot = raw as Shot;
      if (!shot.type || !shot.rating) continue;
      const club = shot.type === "putt" ? "PT" : (shot as { club?: string }).club;
      if (!club) continue;
      const cat = getClubCategory(club);
      if (!cat) continue;
      const entry = map.get(cat) ?? { total: 0, count: 0 };
      entry.total += shot.rating;
      entry.count++;
      map.set(cat, entry);
    }
  }

  return Array.from(map.entries()).map(([category, data]) => ({
    category,
    avgRating: data.total / data.count,
    count: data.count,
  }));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id: roundId } = await params;

    // ラウンドデータ取得
    const { data: round, error: roundError } = await supabase
      .from("rounds")
      .select(
        `id, member_id, date, tee_color, weather,
        courses(name),
        scores(id, round_id, hole_number, par, distance, score, putts, fairway_result, ob, bunker, penalty, pin_position, shots_detail)`
      )
      .eq("id", roundId)
      .single();

    if (roundError || !round) {
      return NextResponse.json({ error: "ラウンドが見つかりません" }, { status: 404 });
    }

    const scores = (round.scores as unknown as Score[]) ?? [];
    const stats = calculateSingleRoundStats(scores);
    const clubRatings = calcClubRatings(scores);
    const courseName = (round.courses as unknown as { name: string })?.name ?? "不明";

    // ホールごとの詳細
    const sorted = [...scores].sort((a, b) => a.hole_number - b.hole_number);
    const holeDetails = sorted
      .map((s) => {
        const diff = s.score - s.par;
        const diffStr = diff > 0 ? `+${diff}` : diff === 0 ? "E" : String(diff);
        return `H${s.hole_number}(Par${s.par}): ${s.score}打(${diffStr}), ${s.putts}パット, FW:${s.fairway_result ?? "-"}, OB:${s.ob}`;
      })
      .join("\n");

    // クラブ評価セクション
    const ratingSection =
      clubRatings.length > 0
        ? "\n## クラブ別自己評価(5点満点)\n" +
          clubRatings
            .map((r) => `- ${r.category}: ${r.avgRating.toFixed(1)}点 (${r.count}ショット)`)
            .join("\n")
        : "";

    const overPar = stats.overPar;
    const overParStr = overPar > 0 ? `+${overPar}` : overPar === 0 ? "E" : String(overPar);

    const prompt = `あなたはプロのゴルフコーチです。以下の1ラウンドのデータを分析し、このラウンドの振り返りと具体的な改善アドバイスを日本語で提供してください。

## ラウンド情報
- コース: ${courseName}
- 日付: ${round.date}
- ティー: ${round.tee_color ?? "不明"}
- 天候: ${round.weather ?? "不明"}

## スコアサマリー
- スコア: ${stats.totalScore} (${overParStr})
- パット: ${stats.totalPutts}
- パーオン率: ${fmtPct(stats.girRate)}
- FWキープ率: ${fmtPct(stats.fairwayKeepRate)}
- リカバリー率: ${fmtPct(stats.scrambleRate)}
- バーディー: ${stats.birdieCount}個, パー: ${stats.parCount}個, ボギー: ${stats.bogeyCount}個, ダボ以上: ${stats.doubleBogeyPlusCount}個
- OB: ${stats.obCount}個

## スコアリング
- Par3平均: ${fmt(stats.par3Avg)}, Par4平均: ${fmt(stats.par4Avg)}, Par5平均: ${fmt(stats.par5Avg)}
- ボギー回避率: ${fmtPct(stats.bogeyAvoidance)}, ダボ回避率: ${fmtPct(stats.doubleBogeyAvoidance)}
- バウンスバック率: ${fmtPct(stats.bounceBackRate)}

## パッティング
- パーオン時パット: ${fmt(stats.puttsPerGir)}
- 3パット回避率: ${fmtPct(stats.threePuttAvoidance)}
- 1パット率: ${fmtPct(stats.onePuttRate)}

## ショット
- FWからGIR: ${fmtPct(stats.girFromFairway)}
- ラフからGIR: ${fmtPct(stats.girFromRough)}
${ratingSection}

## ホール詳細
${holeDetails}

## 指示
上記データを総合的に分析し、以下の構成で簡潔な口調で振り返りを作成してください:

1. **ラウンド総評**: このラウンド全体の印象を2-3行で（良かった点と課題を含む）
・Good：
・Bad：
2. **最大の課題**: スコアに最も悪影響を与えたポイントを2-3つ特定し、データを根拠に説明
3. **良かった点**: 特に光った部分を2-3つ挙げる
4. **次ラウンドへの具体的アクション**: 課題に対するの具体的な練習メニュー&コース攻略のアドバイス

回答は500文字以内で簡潔にまとめてください。クラブ別自己評価がある場合はそれも参考にしてください。`;

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? "gemini-3.0-flash",
    });
    const result = await model.generateContent(prompt);
    const advice = result.response.text();

    return NextResponse.json({ advice });
  } catch (error) {
    console.error("Round advice generation error:", error);
    return NextResponse.json({ error: "アドバイスの生成に失敗しました" }, { status: 500 });
  }
}
