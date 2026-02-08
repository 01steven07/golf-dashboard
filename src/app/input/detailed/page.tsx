"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DetailedRoundData, HoleData, createDefaultHole } from "@/types/shot";
import { HoleInput } from "@/components/shot-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Save, RotateCcw } from "lucide-react";

// 初期状態：18ホール分
function createInitialHoles(): HoleData[] {
  // 一般的なパー設定（OUT: 4-4-3-4-5-4-3-4-5, IN: 4-4-3-4-5-4-3-4-5）
  const defaultPars: (3 | 4 | 5)[] = [4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5];
  return defaultPars.map((par, i) => createDefaultHole(i + 1, par));
}

export default function DetailedInputPage() {
  const router = useRouter();
  const [roundData, setRoundData] = useState<DetailedRoundData>({
    courseId: null,
    courseName: "",
    date: new Date().toISOString().split("T")[0],
    teeColor: "White",
    holes: createInitialHoles(),
  });

  const [isSaving, setIsSaving] = useState(false);

  const updateHole = (holeNumber: number, hole: HoleData) => {
    setRoundData({
      ...roundData,
      holes: roundData.holes.map((h) =>
        h.holeNumber === holeNumber ? hole : h
      ),
    });
  };

  // スコア集計
  const totalScore = roundData.holes.reduce(
    (sum, h) => sum + (h.shots.length || 0),
    0
  );
  const totalPar = roundData.holes.reduce((sum, h) => sum + h.par, 0);
  const outScore = roundData.holes
    .slice(0, 9)
    .reduce((sum, h) => sum + (h.shots.length || 0), 0);
  const inScore = roundData.holes
    .slice(9)
    .reduce((sum, h) => sum + (h.shots.length || 0), 0);
  const totalPutts = roundData.holes.reduce(
    (sum, h) => sum + h.shots.filter((s) => s.type === "putt").length,
    0
  );

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: 実際の保存処理
    console.log("保存データ:", roundData);
    alert("詳細ショットデータの保存は未実装です");
    setIsSaving(false);
  };

  const handleReset = () => {
    if (confirm("入力内容をリセットしますか？")) {
      setRoundData({
        ...roundData,
        holes: createInitialHoles(),
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* ヘッダー */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-green-800">詳細スコア入力</h1>
      </div>

      {/* ラウンド情報 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">ラウンド情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>コース名</Label>
              <Input
                value={roundData.courseName}
                onChange={(e) =>
                  setRoundData({ ...roundData, courseName: e.target.value })
                }
                placeholder="例: 東京ゴルフ倶楽部"
              />
            </div>
            <div>
              <Label>日付</Label>
              <Input
                type="date"
                value={roundData.date}
                onChange={(e) =>
                  setRoundData({ ...roundData, date: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <Label>ティー</Label>
            <div className="flex gap-2 mt-1">
              {["Back", "Regular", "White", "Gold", "Red"].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setRoundData({ ...roundData, teeColor: color })}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    roundData.teeColor === color
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* スコア集計（固定表示） */}
      <div className="sticky top-0 z-10 bg-white border rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-500">OUT</div>
            <div className="text-xl font-bold text-green-700">
              {outScore > 0 ? outScore : "-"}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">IN</div>
            <div className="text-xl font-bold text-green-700">
              {inScore > 0 ? inScore : "-"}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">TOTAL</div>
            <div className="text-2xl font-bold text-green-800">
              {totalScore > 0 ? totalScore : "-"}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Par{totalPar}</div>
            <div className="text-xl font-bold text-gray-600">
              {totalScore > 0
                ? totalScore - totalPar > 0
                  ? `+${totalScore - totalPar}`
                  : totalScore - totalPar
                : "-"}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">パット</div>
            <div className="text-xl font-bold text-purple-700">
              {totalPutts > 0 ? totalPutts : "-"}
            </div>
          </div>
        </div>
      </div>

      {/* OUT 1-9 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm mr-2">
            OUT
          </span>
          1〜9番ホール
        </h2>
        <div className="space-y-4">
          {roundData.holes.slice(0, 9).map((hole) => (
            <HoleInput
              key={hole.holeNumber}
              hole={hole}
              onChange={(h) => updateHole(hole.holeNumber, h)}
            />
          ))}
        </div>
      </div>

      {/* IN 10-18 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm mr-2">
            IN
          </span>
          10〜18番ホール
        </h2>
        <div className="space-y-4">
          {roundData.holes.slice(9).map((hole) => (
            <HoleInput
              key={hole.holeNumber}
              hole={hole}
              onChange={(h) => updateHole(hole.holeNumber, h)}
            />
          ))}
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="sticky bottom-4 flex gap-4 justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={handleReset}
          className="shadow-lg"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          リセット
        </Button>
        <Button
          size="lg"
          onClick={handleSave}
          disabled={isSaving || !roundData.courseName}
          className="bg-green-600 hover:bg-green-700 shadow-lg"
        >
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? "保存中..." : "保存する"}
        </Button>
      </div>
    </div>
  );
}
