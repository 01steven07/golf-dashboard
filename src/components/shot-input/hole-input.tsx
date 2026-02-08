"use client";

import { useState } from "react";
import { HoleData, Shot, TeeShot, ApproachShot, PuttShot, createDefaultTeeShot, createDefaultApproachShot, createDefaultPutt } from "@/types/shot";
import { TeeShotInput } from "./tee-shot-input";
import { ApproachShotInput } from "./approach-shot-input";
import { PuttInput } from "./putt-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface HoleInputProps {
  hole: HoleData;
  onChange: (hole: HoleData) => void;
}

export function HoleInput({ hole, onChange }: HoleInputProps) {
  const [isExpanded, setIsExpanded] = useState(true);

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
    onChange({ ...hole, shots: [...hole.shots, newShot] });
  };

  const updateShot = (index: number, shot: Shot) => {
    const newShots = [...hole.shots];
    newShots[index] = shot;
    onChange({ ...hole, shots: newShots });
  };

  const removeShot = (index: number) => {
    const newShots = hole.shots.filter((_, i) => i !== index);
    onChange({ ...hole, shots: newShots });
  };

  // ショット数からスコアを計算
  const calculatedScore = hole.shots.length;

  // パット数を計算
  const puttCount = hole.shots.filter((s) => s.type === "putt").length;

  // ショット種別ごとにグループ化して番号を付与
  let approachNumber = 0;
  let puttNumber = 0;

  return (
    <Card className="border-2 border-green-300">
      <CardHeader
        className="cursor-pointer bg-green-100 hover:bg-green-200 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-4">
            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
              Hole {hole.holeNumber}
            </span>
            <span className="text-gray-600">Par {hole.par}</span>
            {hole.distance && (
              <span className="text-gray-500 text-sm">{hole.distance}yd</span>
            )}
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-green-700">
                {calculatedScore > 0 ? calculatedScore : "-"}
              </div>
              <div className="text-xs text-gray-500">
                {puttCount > 0 ? `${puttCount}パット` : ""}
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-4 space-y-4">
          {/* ホール情報 */}
          <div className="flex gap-4 items-end">
            <div>
              <Label className="text-sm text-gray-600">Par</Label>
              <div className="flex gap-2 mt-1">
                {[3, 4, 5].map((par) => (
                  <button
                    key={par}
                    type="button"
                    onClick={() => onChange({ ...hole, par: par as 3 | 4 | 5 })}
                    className={`w-10 h-10 rounded-lg border transition-colors ${
                      hole.par === par
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
                    }`}
                  >
                    {par}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">距離 (yd)</Label>
              <Input
                type="number"
                value={hole.distance ?? ""}
                onChange={(e) =>
                  onChange({
                    ...hole,
                    distance: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="例: 420"
                className="w-24 mt-1"
              />
            </div>
          </div>

          {/* ショット一覧 */}
          <div className="space-y-3">
            {hole.shots.map((shot, index) => {
              if (shot.type === "tee") {
                return (
                  <div key={index} className="relative">
                    <TeeShotInput
                      shot={shot as TeeShot}
                      onChange={(s) => updateShot(index, s)}
                    />
                    <button
                      type="button"
                      onClick={() => removeShot(index)}
                      className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              } else if (shot.type === "approach") {
                approachNumber++;
                return (
                  <div key={index} className="relative">
                    <ApproachShotInput
                      shot={shot as ApproachShot}
                      onChange={(s) => updateShot(index, s)}
                      shotNumber={approachNumber + 1}
                    />
                    <button
                      type="button"
                      onClick={() => removeShot(index)}
                      className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              } else {
                puttNumber++;
                return (
                  <div key={index} className="relative">
                    <PuttInput
                      shot={shot as PuttShot}
                      onChange={(s) => updateShot(index, s)}
                      puttNumber={puttNumber}
                    />
                    <button
                      type="button"
                      onClick={() => removeShot(index)}
                      className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              }
            })}
          </div>

          {/* ショット追加ボタン */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addShot("tee")}
              className="text-green-700 border-green-300 hover:bg-green-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              ティーショット
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addShot("approach")}
              className="text-blue-700 border-blue-300 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              ショット/アプローチ
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addShot("putt")}
              className="text-purple-700 border-purple-300 hover:bg-purple-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              パット
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
