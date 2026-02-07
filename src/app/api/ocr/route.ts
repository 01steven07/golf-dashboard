import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { OcrResult } from "@/types/ocr";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const PROMPT = `あなたはゴルフスコアカードを解析するAIです。
画像からスコアカードの情報を読み取り、以下のJSON形式で出力してください。

{
  "course_name": "コース名",
  "date": "YYYY-MM-DD形式の日付（読み取れない場合は空文字）",
  "tee_color": "ティーの色（Blue, White, Red, Gold, Blackのいずれか。不明な場合はWhite）",
  "scores": [
    {
      "hole_number": 1,
      "par": 4,
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
- scoreは実際のスコア（読み取れない場合はparと同じ値）
- puttsはパット数（読み取れない場合は2）
- fairway_resultは "keep"（フェアウェイキープ）、"left"（左ミス）、"right"（右ミス）のいずれか（読み取れない場合は"keep"）
- ob, bunker, penaltyは該当する数（読み取れない場合は0）
- JSONのみを出力し、他のテキストは含めない`;

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

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    const ocrResult: OcrResult = JSON.parse(jsonStr);

    // 18ホール分のデータがない場合は補完
    if (ocrResult.scores.length < 18) {
      for (let i = ocrResult.scores.length + 1; i <= 18; i++) {
        ocrResult.scores.push({
          hole_number: i,
          par: 4,
          score: 4,
          putts: 2,
          fairway_result: "keep",
          ob: 0,
          bunker: 0,
          penalty: 0,
        });
      }
    }

    return NextResponse.json(ocrResult);
  } catch (error) {
    console.error("OCR Error:", error);
    return NextResponse.json(
      { error: "スコアカードの解析に失敗しました" },
      { status: 500 }
    );
  }
}
