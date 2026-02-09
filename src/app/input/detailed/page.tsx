"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DetailedRoundData, HoleData, Shot, TeeShot, ApproachShot, PuttShot, createDefaultHole, createDefaultTeeShot, createDefaultApproachShot, createDefaultPutt } from "@/types/shot";
import { CourseWithDetails, SubCourseWithHoles } from "@/types/database";
import { CourseSelector } from "@/components/course/course-selector";
import { SubCourseSelector } from "@/components/course/sub-course-selector";
import { TeeShotInput } from "@/components/shot-input/tee-shot-input";
import { ApproachShotInput } from "@/components/shot-input/approach-shot-input";
import { PuttInput } from "@/components/shot-input/putt-input";
import { ScoreDisplay } from "@/components/shot-input/score-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Save, RotateCcw, Plus, Trash2, Flag, Target, Circle } from "lucide-react";

// スコア差分の表示テキスト
function getScoreDiffText(score: number, par: number): string {
  if (score === 0) return "";
  const diff = score - par;
  if (diff <= -3) return "🦅🦅";
  if (diff === -2) return "🦅";
  if (diff === -1) return "🐦";
  if (diff === 0) return "○";
  if (diff === 1) return "□";
  if (diff === 2) return "□□";
  return `+${diff}`;
}

// 初期状態：18ホール分
function createInitialHoles(): HoleData[] {
  const defaultPars: (3 | 4 | 5)[] = [4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5];
  return defaultPars.map((par, i) => createDefaultHole(i + 1, par));
}

/** コースデータからホールを生成 */
function createHolesFromCourse(
  subCourses: SubCourseWithHoles[],
  selectedSubCourseIds: string[],
  teeName: string | null
): HoleData[] {
  const holes: HoleData[] = [];
  let holeNum = 1;
  for (const sc of subCourses) {
    if (!selectedSubCourseIds.includes(sc.id)) continue;
    for (const h of sc.holes) {
      const distance = teeName && h.distances[teeName] ? h.distances[teeName] : null;
      holes.push(
        createDefaultHole(
          holeNum,
          (h.par >= 3 && h.par <= 6 ? h.par : 4) as 3 | 4 | 5 | 6
        )
      );
      holes[holes.length - 1].distance = distance;
      holeNum++;
    }
  }
  return holes.length > 0 ? holes : createInitialHoles();
}

export default function DetailedInputPage() {
  const router = useRouter();
  const [currentHole, setCurrentHole] = useState(1);
  const [roundData, setRoundData] = useState<DetailedRoundData>({
    courseId: null,
    courseName: "",
    date: new Date().toISOString().split("T")[0],
    teeColor: "White",
    teeId: null,
    subCourseIds: [],
    holes: createInitialHoles(),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showRoundInfo, setShowRoundInfo] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithDetails | null>(null);

  const hole = roundData.holes[currentHole - 1];
  const totalHoles = roundData.holes.length;

  // コース選択時のコールバック
  const handleCourseSelect = useCallback((course: CourseWithDetails | null) => {
    setSelectedCourse(course);
    if (course) {
      // デフォルトで全サブコースを選択
      const allSubCourseIds = course.sub_courses.map((sc) => sc.id);
      const defaultTee = course.tees.length > 0 ? course.tees[0] : null;
      const teeName = defaultTee?.name ?? null;

      const newHoles = createHolesFromCourse(
        course.sub_courses,
        allSubCourseIds,
        teeName
      );

      setRoundData((prev) => ({
        ...prev,
        courseId: course.id,
        courseName: course.name,
        teeColor: defaultTee?.name ?? "White",
        teeId: defaultTee?.id ?? null,
        subCourseIds: allSubCourseIds,
        holes: newHoles,
      }));
      setCurrentHole(1);
    } else {
      setRoundData((prev) => ({
        ...prev,
        courseId: null,
        courseName: "",
        teeId: null,
        subCourseIds: [],
        holes: createInitialHoles(),
      }));
      setCurrentHole(1);
    }
  }, []);

  const handleManualInput = useCallback((name: string) => {
    setRoundData((prev) => ({
      ...prev,
      courseId: null,
      courseName: name,
    }));
  }, []);

  const handleSubCourseToggle = useCallback((subCourseId: string) => {
    if (!selectedCourse) return;

    setRoundData((prev) => {
      const newIds = prev.subCourseIds.includes(subCourseId)
        ? prev.subCourseIds.filter((id) => id !== subCourseId)
        : [...prev.subCourseIds, subCourseId];

      // sort by original order
      const sortedIds = selectedCourse.sub_courses
        .filter((sc) => newIds.includes(sc.id))
        .map((sc) => sc.id);

      const selectedTee = selectedCourse.tees.find((t) => t.id === prev.teeId);
      const teeName = selectedTee?.name ?? null;

      const newHoles = createHolesFromCourse(
        selectedCourse.sub_courses,
        sortedIds,
        teeName
      );

      return {
        ...prev,
        subCourseIds: sortedIds,
        holes: newHoles,
      };
    });
    setCurrentHole(1);
  }, [selectedCourse]);

  const handleTeeSelect = useCallback((teeId: string) => {
    if (!selectedCourse) return;

    const tee = selectedCourse.tees.find((t) => t.id === teeId);
    if (!tee) return;

    setRoundData((prev) => {
      const newHoles = createHolesFromCourse(
        selectedCourse.sub_courses,
        prev.subCourseIds,
        tee.name
      );

      return {
        ...prev,
        teeId: teeId,
        teeColor: tee.name,
        holes: newHoles,
      };
    });
    setCurrentHole(1);
  }, [selectedCourse]);

  const updateHole = (updatedHole: HoleData) => {
    setRoundData({
      ...roundData,
      holes: roundData.holes.map((h) =>
        h.holeNumber === currentHole ? updatedHole : h
      ),
    });
  };

  const addShot = (type: "tee" | "approach" | "putt") => {
    let newShot: Shot;
    switch (type) {
      case "tee":
        newShot = createDefaultTeeShot();
        break;
      case "approach":
        newShot = createDefaultApproachShot();
        break;
      case "putt":
        newShot = createDefaultPutt();
        break;
    }
    updateHole({ ...hole, shots: [...hole.shots, newShot] });
  };

  const updateShot = (index: number, shot: Shot) => {
    const newShots = [...hole.shots];
    newShots[index] = shot;
    updateHole({ ...hole, shots: newShots });
  };

  const removeShot = (index: number) => {
    const newShots = hole.shots.filter((_, i) => i !== index);
    updateHole({ ...hole, shots: newShots });
  };

  // サブコース情報を計算
  const subCourseInfo = useMemo(() => {
    if (!selectedCourse || roundData.subCourseIds.length === 0) {
      // 手動入力モード: 前半9ホール/後半9ホール
      const firstHalf = roundData.holes.slice(0, Math.ceil(totalHoles / 2));
      const secondHalf = roundData.holes.slice(Math.ceil(totalHoles / 2));
      return [
        { name: "OUT", holes: firstHalf },
        { name: "IN", holes: secondHalf },
      ].filter((s) => s.holes.length > 0);
    }

    // コース選択モード: サブコース別に分割
    const result: { name: string; holes: HoleData[] }[] = [];
    let offset = 0;
    for (const sc of selectedCourse.sub_courses) {
      if (!roundData.subCourseIds.includes(sc.id)) continue;
      result.push({
        name: sc.name,
        holes: roundData.holes.slice(offset, offset + sc.hole_count),
      });
      offset += sc.hole_count;
    }
    return result;
  }, [selectedCourse, roundData.subCourseIds, roundData.holes, totalHoles]);

  // スコア集計
  const stats = useMemo(() => {
    const sectionScores = subCourseInfo.map((s) => ({
      name: s.name,
      score: s.holes.reduce((sum, h) => sum + h.shots.length, 0),
    }));

    const totalScore = roundData.holes.reduce((sum, h) => sum + h.shots.length, 0);
    const totalPar = roundData.holes.reduce((sum, h) => sum + h.par, 0);
    const totalPutts = roundData.holes.reduce(
      (sum, h) => sum + h.shots.filter((s) => s.type === "putt").length,
      0
    );

    return { sectionScores, totalScore, totalPar, totalPutts };
  }, [roundData.holes, subCourseInfo]);

  const currentHoleScore = hole.shots.length;
  const currentHolePutts = hole.shots.filter((s) => s.type === "putt").length;

  const handleSave = async () => {
    setIsSaving(true);
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
      setCurrentHole(1);
    }
  };

  // ショット番号を計算
  let approachNumber = 0;
  let puttNumber = 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* 固定ヘッダー */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        {/* ナビゲーションバー */}
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-gray-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-green-800">詳細入力</h1>
          <button
            onClick={() => setShowRoundInfo(!showRoundInfo)}
            className="p-2 text-gray-600 text-sm"
          >
            {showRoundInfo ? "閉じる" : "情報"}
          </button>
        </div>

        {/* ラウンド情報（折りたたみ可能） */}
        {showRoundInfo && (
          <div className="px-4 py-3 bg-gray-50 border-t space-y-2">
            <div className="space-y-2">
              <CourseSelector
                onCourseSelect={handleCourseSelect}
                onManualInput={handleManualInput}
                courseName={roundData.courseName}
              />
              <div>
                <Label className="text-xs text-gray-500">日付</Label>
                <Input
                  type="date"
                  value={roundData.date}
                  onChange={(e) =>
                    setRoundData({ ...roundData, date: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
            </div>
            {/* コース選択時: サブコース＋ティー選択 */}
            {selectedCourse && selectedCourse.sub_courses.length > 0 && (
              <SubCourseSelector
                subCourses={selectedCourse.sub_courses}
                tees={selectedCourse.tees}
                selectedSubCourseIds={roundData.subCourseIds}
                selectedTeeId={roundData.teeId}
                onSubCourseToggle={handleSubCourseToggle}
                onTeeSelect={handleTeeSelect}
              />
            )}
            {/* 手動入力時: ティー色選択 */}
            {!selectedCourse && (
              <div className="flex gap-1 overflow-x-auto pb-1">
                {["Back", "Regular", "White", "Gold", "Red"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setRoundData({ ...roundData, teeColor: color })}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                      roundData.teeColor === color
                        ? "bg-green-600 text-white"
                        : "bg-white text-gray-600 border"
                    )}
                  >
                    {color}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* スコア概要 */}
        <div className={cn(
          "grid gap-1 px-4 py-2 bg-green-50 text-center text-sm",
          `grid-cols-${Math.min(stats.sectionScores.length + 3, 7)}`
        )} style={{ gridTemplateColumns: `repeat(${stats.sectionScores.length + 3}, minmax(0, 1fr))` }}>
          {stats.sectionScores.map((section) => (
            <div key={section.name}>
              <div className="text-xs text-gray-500">{section.name}</div>
              <div className="font-bold text-green-700">
                {section.score || "-"}
              </div>
            </div>
          ))}
          <div>
            <div className="text-xs text-gray-500">TOTAL</div>
            <div className="font-bold text-lg text-green-800">
              {stats.totalScore || "-"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">±Par</div>
            <div className={cn(
              "font-bold",
              stats.totalScore - stats.totalPar > 0 ? "text-red-600" :
              stats.totalScore - stats.totalPar < 0 ? "text-blue-600" : "text-gray-600"
            )}>
              {stats.totalScore
                ? stats.totalScore - stats.totalPar > 0
                  ? `+${stats.totalScore - stats.totalPar}`
                  : stats.totalScore - stats.totalPar
                : "-"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Putt</div>
            <div className="font-bold text-purple-700">
              {stats.totalPutts || "-"}
            </div>
          </div>
        </div>

        {/* ホールナビゲーション */}
        <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto">
          {roundData.holes.map((h) => {
            const holeScore = h.shots.length;
            const scoreDiff = holeScore - h.par;
            const scoreSymbol = holeScore === 0 ? "" : getScoreDiffText(holeScore, h.par);

            return (
              <button
                key={h.holeNumber}
                onClick={() => setCurrentHole(h.holeNumber)}
                className={cn(
                  "flex-shrink-0 min-w-[2.5rem] h-10 px-1 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center",
                  currentHole === h.holeNumber
                    ? "bg-green-600 text-white shadow-md"
                    : holeScore === 0
                    ? "bg-gray-100 text-gray-500"
                    : scoreDiff < 0
                    ? "bg-blue-100 text-blue-700"
                    : scoreDiff === 0
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                )}
              >
                <span>{h.holeNumber}</span>
                {holeScore > 0 && (
                  <span className="text-[10px] leading-none">{scoreSymbol}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 現在のホール */}
      <div className="px-4 py-4">
        {/* ホールヘッダー */}
        <Card className="mb-4 border-2 border-green-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-green-600 text-white flex flex-col items-center justify-center">
                  <span className="text-xs">HOLE</span>
                  <span className="text-xl font-bold">{currentHole}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Par</span>
                    <div className="flex gap-1">
                      {[3, 4, 5, 6].map((par) => (
                        <button
                          key={par}
                          type="button"
                          onClick={() => updateHole({ ...hole, par: par as 3 | 4 | 5 | 6 })}
                          className={cn(
                            "w-8 h-8 rounded-lg text-sm font-bold transition-all",
                            hole.par === par
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {par}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">距離</span>
                    <Input
                      type="number"
                      value={hole.distance ?? ""}
                      onChange={(e) =>
                        updateHole({
                          ...hole,
                          distance: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="yd"
                      className="w-20 h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <ScoreDisplay score={currentHoleScore} par={hole.par} size="lg" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">
                    {currentHolePutts > 0 ? `${currentHolePutts}パット` : ""}
                  </div>
                  {currentHoleScore > 0 && (
                    <div className="text-lg font-bold">
                      {getScoreDiffText(currentHoleScore, hole.par)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ショット追加ボタン */}
        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addShot("tee")}
            className="flex-1 h-12 text-green-700 border-green-300 bg-green-50"
          >
            <Flag className="w-4 h-4 mr-1" />
            ティー
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addShot("approach")}
            className="flex-1 h-12 text-blue-700 border-blue-300 bg-blue-50"
          >
            <Target className="w-4 h-4 mr-1" />
            ショット
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addShot("putt")}
            className="flex-1 h-12 text-purple-700 border-purple-300 bg-purple-50"
          >
            <Circle className="w-4 h-4 mr-1" />
            パット
          </Button>
        </div>

        {/* ショット一覧 */}
        <div className="space-y-4">
          {hole.shots.map((shot, index) => {
            if (shot.type === "tee") {
              return (
                <Card key={index} className="border-2 border-green-200 overflow-hidden">
                  <div className="bg-green-100 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">
                        {index + 1}打目 - ティーショット
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeShot(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <TeeShotInput
                      shot={shot as TeeShot}
                      onChange={(s) => updateShot(index, s)}
                    />
                  </CardContent>
                </Card>
              );
            } else if (shot.type === "approach") {
              approachNumber++;
              return (
                <Card key={index} className="border-2 border-blue-200 overflow-hidden">
                  <div className="bg-blue-100 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        {index + 1}打目 - ショット/アプローチ
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeShot(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <ApproachShotInput
                      shot={shot as ApproachShot}
                      onChange={(s) => updateShot(index, s)}
                      shotNumber={approachNumber}
                    />
                  </CardContent>
                </Card>
              );
            } else {
              puttNumber++;
              return (
                <Card key={index} className="border-2 border-purple-200 overflow-hidden">
                  <div className="bg-purple-100 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Circle className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-800">
                        {puttNumber}パット目
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeShot(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <PuttInput
                      shot={shot as PuttShot}
                      onChange={(s) => updateShot(index, s)}
                      puttNumber={puttNumber}
                    />
                  </CardContent>
                </Card>
              );
            }
          })}

          {hole.shots.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>上のボタンからショットを追加してください</p>
            </div>
          )}

          {/* ショットがある場合は下部にも追加ボタンを表示 */}
          {hole.shots.length > 0 && (
            <div className="mt-6 pt-4 border-t border-dashed border-gray-300">
              <div className="text-center text-sm text-gray-500 mb-3">
                次のショットを追加
              </div>
              <div className="flex gap-2">
                {/* ティーショットがない場合は表示 */}
                {!hole.shots.some(s => s.type === "tee") && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addShot("tee")}
                    className="flex-1 h-11 text-green-700 border-green-300 bg-green-50"
                  >
                    <Flag className="w-4 h-4 mr-1" />
                    ティー
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addShot("approach")}
                  className="flex-1 h-11 text-blue-700 border-blue-300 bg-blue-50"
                >
                  <Target className="w-4 h-4 mr-1" />
                  ショット
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addShot("putt")}
                  className="flex-1 h-11 text-purple-700 border-purple-300 bg-purple-50"
                >
                  <Circle className="w-4 h-4 mr-1" />
                  パット
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 固定フッター */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        {/* ホール切り替え */}
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentHole(Math.max(1, currentHole - 1))}
            disabled={currentHole === 1}
            className="w-24"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            前へ
          </Button>

          <div className="text-center">
            <div className="text-sm text-gray-500">
              {(() => {
                let offset = 0;
                for (const section of subCourseInfo) {
                  if (currentHole <= offset + section.holes.length) {
                    return section.name;
                  }
                  offset += section.holes.length;
                }
                return "";
              })()}
            </div>
            <div className="font-bold text-green-700">
              Hole {currentHole} / {totalHoles}
            </div>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentHole(Math.min(totalHoles, currentHole + 1))}
            disabled={currentHole === totalHoles}
            className="w-24"
          >
            次へ
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>

        {/* 操作ボタン */}
        <div className="flex gap-2 px-4 pb-4">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            リセット
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !roundData.courseName}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "保存中..." : "保存する"}
          </Button>
        </div>
      </div>
    </div>
  );
}
