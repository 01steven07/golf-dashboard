import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { OcrResult, OcrScoreData } from "@/types/ocr";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export const PROMPT = `あなたはゴルフスコアカードを解析するAIです。
画像からスコアカードの情報を読み取り、以下のJSON形式で出力してください。

{
  "course_name": "コース名",
  "date": "YYYY-MM-DD形式の日付（読み取れない場合は空文字）",
  "tee_color": "ティーの色（Blue, White, Red, Gold, Blackのいずれか。不明な場合はWhite）",
  "scores": [
    {
      "hole_number": 1,
      "par": 4,
      "distance": 350,
      "score": 5,
      "putts": 2,
      "fairway_result": "keep",
      "ob": 0,
      "bunker": 0,
      "penalty": 0
    }
  ]
}

重要なルール:
- scoresは必ず18ホール分（hole_number 1〜18）を出力
- parは3, 4, 5のいずれか
- distanceはホールの距離（ヤード単位の整数）。読み取れない場合はnull
- scoreは実際のスコア（読み取れない場合はparと同じ値）
- puttsはパット数（読み取れない場合は2）
- fairway_resultは "keep"（フェアウェイキープ）、"left"（左ミス）、"right"（右ミス）のいずれか（読み取れない場合は"keep"）
- ob, bunker, penaltyは該当する数（読み取れない場合は0）
- JSONのみを出力し、他のテキストは含めない`;

/**
 * OCR結果のスコアデータを正規化・補完する
 */
export function normalizeOcrScores(scores: Partial<OcrScoreData>[]): OcrScoreData[] {
  const normalized: OcrScoreData[] = [];

  for (let holeNum = 1; holeNum <= 18; holeNum++) {
    const existing = scores.find((s) => s.hole_number === holeNum);

    normalized.push({
      hole_number: holeNum,
      par: validatePar(existing?.par) ?? 4,
      distance: validateDistance(existing?.distance),
      score: existing?.score && existing.score > 0 ? existing.score : 4,
      putts: existing?.putts !== undefined && existing.putts >= 0 ? existing.putts : 2,
      fairway_result: validateFairwayResult(existing?.fairway_result) ?? "keep",
      ob: existing?.ob !== undefined && existing.ob >= 0 ? existing.ob : 0,
      bunker: existing?.bunker !== undefined && existing.bunker >= 0 ? existing.bunker : 0,
      penalty: existing?.penalty !== undefined && existing.penalty >= 0 ? existing.penalty : 0,
    });
  }

  return normalized;
}

/**
 * Par値のバリデーション
 */
export function validatePar(par: unknown): 3 | 4 | 5 | null {
  if (par === 3 || par === 4 || par === 5) {
    return par;
  }
  return null;
}

/**
 * 距離のバリデーション（1-700ヤード）
 */
export function validateDistance(distance: unknown): number | null {
  if (typeof distance === "number" && distance > 0 && distance <= 700) {
    return Math.round(distance);
  }
  return null;
}

/**
 * FairwayResultのバリデーション
 */
export function validateFairwayResult(result: unknown): "keep" | "left" | "right" | null {
  if (result === "keep" || result === "left" || result === "right") {
    return result;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "画像がありません" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type;

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? "gemini-3.0-flash",
    });

    const result = await model.generateContent([
      PROMPT,
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    // JSONを抽出（```json ... ``` で囲まれている場合に対応）
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "解析結果をJSON形式で取得できませんでした" }, { status: 500 });
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const rawResult = JSON.parse(jsonStr);

    // スコアデータを正規化
    const ocrResult: OcrResult = {
      course_name: rawResult.course_name ?? "",
      date: rawResult.date ?? "",
      tee_color: rawResult.tee_color ?? "White",
      scores: normalizeOcrScores(rawResult.scores ?? []),
    };

    return NextResponse.json(ocrResult);
  } catch (error) {
    console.error("OCR Error:", error);
    return NextResponse.json(
      { error: "スコアカードの解析に失敗しました" },
      { status: 500 }
    );
  }
}
