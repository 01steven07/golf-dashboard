import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/api-auth";

// PATCH: 特定ホールのスコアデータを更新
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id: roundId } = await params;
    const body = await request.json();
    const {
      score_id,
      score,
      putts,
      fairway_result,
      ob,
      bunker,
      penalty,
      pin_position,
      shots_detail,
    } = body;

    if (!score_id || typeof score_id !== "string") {
      return NextResponse.json({ error: "score_id は必須です" }, { status: 400 });
    }

    // round_id の所有者チェック
    const { data: round, error: roundError } = await supabase
      .from("rounds")
      .select("id, member_id")
      .eq("id", roundId)
      .single();

    if (roundError || !round) {
      return NextResponse.json({ error: "ラウンドが見つかりません" }, { status: 404 });
    }

    if (round.member_id !== auth.id) {
      return NextResponse.json(
        { error: "このラウンドを編集する権限がありません" },
        { status: 403 }
      );
    }

    // score_id が round_id に紐づくか確認
    const { data: existingScore, error: scoreError } = await supabase
      .from("scores")
      .select("id, round_id")
      .eq("id", score_id)
      .single();

    if (scoreError || !existingScore) {
      return NextResponse.json({ error: "スコアが見つかりません" }, { status: 404 });
    }

    if (existingScore.round_id !== roundId) {
      return NextResponse.json(
        { error: "このスコアは指定されたラウンドに属していません" },
        { status: 400 }
      );
    }

    // 更新データを構築
    const updateData: Record<string, unknown> = {};

    if (score !== undefined) {
      if (typeof score !== "number" || score < 1) {
        return NextResponse.json(
          { error: "スコアは1以上の数値を指定してください" },
          { status: 400 }
        );
      }
      updateData.score = score;
    }

    if (putts !== undefined) {
      if (typeof putts !== "number" || putts < 0) {
        return NextResponse.json(
          { error: "パット数は0以上の数値を指定してください" },
          { status: 400 }
        );
      }
      updateData.putts = putts;
    }

    if (fairway_result !== undefined) {
      if (!["keep", "left", "right"].includes(fairway_result)) {
        return NextResponse.json({ error: "無効なフェアウェイ結果です" }, { status: 400 });
      }
      updateData.fairway_result = fairway_result;
    }

    if (ob !== undefined) {
      if (typeof ob !== "number" || ob < 0) {
        return NextResponse.json({ error: "OB数は0以上です" }, { status: 400 });
      }
      updateData.ob = ob;
    }

    if (bunker !== undefined) {
      if (typeof bunker !== "number" || bunker < 0) {
        return NextResponse.json({ error: "バンカー数は0以上です" }, { status: 400 });
      }
      updateData.bunker = bunker;
    }

    if (penalty !== undefined) {
      if (typeof penalty !== "number" || penalty < 0) {
        return NextResponse.json({ error: "ペナルティ数は0以上です" }, { status: 400 });
      }
      updateData.penalty = penalty;
    }

    if (pin_position !== undefined) {
      updateData.pin_position = pin_position;
    }

    if (shots_detail !== undefined) {
      updateData.shots_detail = shots_detail;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "更新するフィールドがありません" }, { status: 400 });
    }

    const { data: updatedScore, error: updateError } = await supabase
      .from("scores")
      .update(updateData)
      .eq("id", score_id)
      .select()
      .single();

    if (updateError) {
      console.error("Update score error:", updateError);
      return NextResponse.json({ error: "スコアの更新に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ score: updatedScore });
  } catch (error) {
    console.error("Update score error:", error);
    return NextResponse.json({ error: "スコアの更新に失敗しました" }, { status: 500 });
  }
}

// POST: 追加ハーフのスコアを一括挿入
import {
  validateAddHalfInput,
  buildScoreRecords,
  AddHalfScoreInput,
} from "@/utils/add-half-validation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id: roundId } = await params;
    const body = await request.json();
    const { scores, course_label, sub_course_ids } = body as {
      scores: AddHalfScoreInput[];
      course_label: string;
      sub_course_ids?: string[];
    };

    // ラウンドの所有者チェック
    const { data: round, error: roundError } = await supabase
      .from("rounds")
      .select("id, member_id, ext_course_labels, played_sub_course_ids")
      .eq("id", roundId)
      .single();

    if (roundError || !round) {
      return NextResponse.json({ error: "ラウンドが見つかりません" }, { status: 404 });
    }

    if (round.member_id !== auth.id) {
      return NextResponse.json(
        { error: "このラウンドを編集する権限がありません" },
        { status: 403 }
      );
    }

    // 既存スコアの最大ホール番号を取得
    const { data: existingScores, error: existingError } = await supabase
      .from("scores")
      .select("hole_number")
      .eq("round_id", roundId)
      .order("hole_number", { ascending: false })
      .limit(1);

    if (existingError) {
      return NextResponse.json({ error: "既存スコアの取得に失敗しました" }, { status: 500 });
    }

    const maxHole = existingScores && existingScores.length > 0 ? existingScores[0].hole_number : 0;

    // バリデーション
    const validation = validateAddHalfInput(scores, maxHole, course_label);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // レコード構築 & 挿入
    const records = buildScoreRecords(scores, roundId, maxHole);

    const { data: insertedScores, error: insertError } = await supabase
      .from("scores")
      .insert(records)
      .select();

    if (insertError) {
      console.error("Insert scores error:", insertError);
      return NextResponse.json({ error: "スコアの追加に失敗しました" }, { status: 500 });
    }

    // ext_course_labels + played_sub_course_ids を更新
    const currentLabels: string[] = (round.ext_course_labels as string[]) ?? [];
    const updatedLabels = [...currentLabels, course_label];

    const currentSubCourseIds: string[] = (round.played_sub_course_ids as string[]) ?? [];
    const updatedSubCourseIds = sub_course_ids
      ? [...currentSubCourseIds, ...sub_course_ids]
      : currentSubCourseIds;

    const { error: updateError } = await supabase
      .from("rounds")
      .update({
        ext_course_labels: updatedLabels,
        played_sub_course_ids: updatedSubCourseIds,
      })
      .eq("id", roundId);

    if (updateError) {
      console.error("Update ext_course_labels error:", updateError);
    }

    return NextResponse.json({ scores: insertedScores }, { status: 201 });
  } catch (error) {
    console.error("Add scores error:", error);
    return NextResponse.json({ error: "スコアの追加に失敗しました" }, { status: 500 });
  }
}
