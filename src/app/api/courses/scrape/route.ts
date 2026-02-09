import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CourseScrapingResult } from "@/types/course";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const PROMPT = `あなたはゴルフ場のWebページからコース情報を抽出するAIです。
以下のHTML（テキスト化済み）からコース情報を読み取り、JSON形式で出力してください。

出力形式:
{
  "course_name": "コース名",
  "pref": "都道府県（例: 東京都）",
  "green_types": ["ベント", "高麗"],
  "tees": ["バック", "レギュラー", "フロント", "レディース"],
  "sub_courses": [
    {
      "name": "OUT",
      "holes": [
        {
          "hole_number": 1,
          "par": 4,
          "handicap": 7,
          "distances": {
            "バック": 405,
            "レギュラー": 375,
            "フロント": 345,
            "レディース": 300
          }
        }
      ]
    }
  ]
}

重要なルール:
- course_nameはゴルフ場の正式名称
- prefは都道府県名（見つからなければnull）
- green_typesはグリーンの種類リスト（ベント、高麗など。見つからなければ空配列）
- teesはティー名のリスト（バック、レギュラー、フロント、レディースなど）
- sub_coursesはコース区分（OUT/IN、東/西/南/北など）
- 各ホールのparは3〜6の整数
- handicapはホールハンディキャップ（見つからなければnull）
- distancesはティー名をキーとした距離（ヤード単位の整数）のオブジェクト
- 情報が見つからない場合は推測せず、空または null にする
- JSONのみを出力し、他のテキストは含めない`;

/** HTMLからテキストを抽出・圧縮する */
function extractText(html: string): string {
  // script, style, noscript タグを除去
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");

  // HTMLタグを除去（ただしtable構造は保持するため改行を入れる）
  text = text.replace(/<\/?(tr|th|td|table)[^>]*>/gi, " | ");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/?(p|div|h[1-6]|li)[^>]*>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");

  // HTMLエンティティをデコード
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(Number(code))
  );

  // 連続空白・改行を圧縮
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n\s*\n/g, "\n");
  text = text.trim();

  // 50KB以内に収める
  if (text.length > 50000) {
    text = text.substring(0, 50000);
  }

  return text;
}

/** POST /api/courses/scrape - URLからコース情報を抽出 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URLを入力してください" },
        { status: 400 }
      );
    }

    // URLバリデーション
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "有効なURLを入力してください" },
        { status: 400 }
      );
    }

    // HTTPSのみ許可
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: "HTTPまたはHTTPSのURLを入力してください" },
        { status: 400 }
      );
    }

    // HTML取得（タイムアウト10秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let html: string;
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; GolfDashboard/1.0; +https://golf-dashboard.vercel.app)",
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: `ページの取得に失敗しました (HTTP ${response.status})` },
          { status: 502 }
        );
      }

      html = await response.text();
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "ページの取得がタイムアウトしました" },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: "ページの取得に失敗しました" },
        { status: 502 }
      );
    }

    // テキスト抽出・圧縮
    const text = extractText(html);

    if (text.length < 50) {
      return NextResponse.json(
        { error: "ページからテキストを抽出できませんでした" },
        { status: 422 }
      );
    }

    // Gemini 2.0 Flash で解析
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent([PROMPT, text]);

    const responseText = result.response.text();

    // JSONを抽出
    const jsonMatch =
      responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
      responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json(
        { error: "解析結果をJSON形式で取得できませんでした" },
        { status: 500 }
      );
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const rawResult = JSON.parse(jsonStr);

    // 結果を正規化
    const scrapingResult: CourseScrapingResult = {
      course_name: rawResult.course_name ?? "",
      pref: rawResult.pref ?? null,
      green_types: Array.isArray(rawResult.green_types)
        ? rawResult.green_types
        : [],
      tees: Array.isArray(rawResult.tees) ? rawResult.tees : [],
      sub_courses: Array.isArray(rawResult.sub_courses)
        ? rawResult.sub_courses.map(
            (sc: {
              name: string;
              holes: {
                hole_number: number;
                par: number;
                handicap: number | null;
                distances: Record<string, number>;
              }[];
            }) => ({
              name: sc.name ?? "",
              holes: Array.isArray(sc.holes)
                ? sc.holes.map((h) => ({
                    hole_number: h.hole_number ?? 1,
                    par: h.par ?? 4,
                    handicap: h.handicap ?? null,
                    distances:
                      typeof h.distances === "object" && h.distances !== null
                        ? h.distances
                        : {},
                  }))
                : [],
            })
          )
        : [],
    };

    return NextResponse.json(scrapingResult);
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: "コース情報の解析に失敗しました" },
      { status: 500 }
    );
  }
}
