"use client";

import { useMemo } from "react";
import {
  DetailedRoundData,
  HoleData,
  Shot,
  TeeShot,
  ApproachShot,
  PuttShot,
  createDefaultTeeShot,
  createDefaultApproachShot,
  createDefaultPutt,
} from "@/types/shot";
import { CourseWithDetails } from "@/types/database";
import { TeeShotInput } from "@/components/shot-input/tee-shot-input";
import { ApproachShotInput } from "@/components/shot-input/approach-shot-input";
import { PuttInput } from "@/components/shot-input/putt-input";
import { ScoreDisplay } from "@/components/shot-input/score-display";
import { PinPositionSelector } from "@/components/pin-position/pin-position-selector";
import { ScoreSummaryBar } from "./score-summary-bar";
import { HoleNavigation } from "./hole-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Flag,
  Target,
  Circle,
  Settings,
} from "lucide-react";

function getScoreDiffText(score: number, par: number): string {
  if (score === 0) return "";
  const diff = score - par;
  if (diff <= -3) return "◎◎";
  if (diff === -2) return "◎";
  if (diff === -1) return "○";
  if (diff === 0) return "-";
  if (diff === 1) return "△";
  if (diff === 2) return "□";
  return `+${diff}`;
}

interface StepScoringProps {
  roundData: DetailedRoundData;
  selectedCourse: CourseWithDetails | null;
  currentHole: number;
  isSaving: boolean;
  onCurrentHoleChange: (hole: number) => void;
  onUpdateHole: (hole: HoleData) => void;
  onSave: () => void;
  onReset: () => void;
  onBackToSettings: () => void;
}

export function StepScoring({
  roundData,
  selectedCourse,
  currentHole,
  isSaving,
  onCurrentHoleChange,
  onUpdateHole,
  onSave,
  onReset,
  onBackToSettings,
}: StepScoringProps) {
  const hole = roundData.holes[currentHole - 1];
  const totalHoles = roundData.holes.length;

  // サブコース情報を計算
  const subCourseInfo = useMemo(() => {
    if (!selectedCourse || roundData.subCourseIds.length === 0) {
      const firstHalf = roundData.holes.slice(0, Math.ceil(totalHoles / 2));
      const secondHalf = roundData.holes.slice(Math.ceil(totalHoles / 2));
      return [
        { name: "OUT", holes: firstHalf },
        { name: "IN", holes: secondHalf },
      ].filter((s) => s.holes.length > 0);
    }

    const result: { name: string; holes: HoleData[] }[] = [];
    let offset = 0;
    for (const scId of roundData.subCourseIds) {
      const sc = selectedCourse.sub_courses.find((s) => s.id === scId);
      if (!sc) continue;
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

    const totalScore = roundData.holes.reduce(
      (sum, h) => sum + h.shots.length,
      0
    );
    const totalPar = roundData.holes.reduce((sum, h) => sum + h.par, 0);
    const totalPutts = roundData.holes.reduce(
      (sum, h) => sum + h.shots.filter((s) => s.type === "putt").length,
      0
    );

    return { sectionScores, totalScore, totalPar, totalPutts };
  }, [roundData.holes, subCourseInfo]);

  const currentHoleScore = hole.shots.length;
  const currentHolePutts = hole.shots.filter(
    (s) => s.type === "putt"
  ).length;

  const updateHole = (updatedHole: HoleData) => {
    onUpdateHole(updatedHole);
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

  // ショット番号を計算
  let approachNumber = 0;
  let puttNumber = 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      {/* Stickyヘッダー（スコア概要 + ホールナビのみ） */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <ScoreSummaryBar
          sectionScores={stats.sectionScores}
          totalScore={stats.totalScore}
          totalPar={stats.totalPar}
          totalPutts={stats.totalPutts}
        />
        <HoleNavigation
          holes={roundData.holes}
          currentHole={currentHole}
          onHoleSelect={onCurrentHoleChange}
        />
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
                          onClick={() =>
                            updateHole({
                              ...hole,
                              par: par as 3 | 4 | 5 | 6,
                            })
                          }
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
                          distance: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      placeholder="yd"
                      className="w-20 h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <ScoreDisplay
                  score={currentHoleScore}
                  par={hole.par}
                  size="lg"
                />
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

            {/* ピン位置セレクター */}
            <div className="mt-4 pt-3 border-t border-green-200">
              <div className="text-xs text-gray-500 mb-2">ピン位置</div>
              <PinPositionSelector
                value={hole.pinPosition}
                onChange={(pos) => updateHole({ ...hole, pinPosition: pos })}
                size="sm"
              />
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
                <Card
                  key={index}
                  className="border-2 border-green-200 overflow-hidden"
                >
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
                <Card
                  key={index}
                  className="border-2 border-blue-200 overflow-hidden"
                >
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
                <Card
                  key={index}
                  className="border-2 border-purple-200 overflow-hidden"
                >
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
                {!hole.shots.some((s) => s.type === "tee") && (
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30">
        {/* ホール切り替え */}
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() =>
              onCurrentHoleChange(Math.max(1, currentHole - 1))
            }
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
            onClick={() =>
              onCurrentHoleChange(Math.min(totalHoles, currentHole + 1))
            }
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
            size="sm"
            onClick={onBackToSettings}
            className="px-3"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={onReset} className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" />
            リセット
          </Button>
          <Button
            onClick={onSave}
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
