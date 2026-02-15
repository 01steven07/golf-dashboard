"use client";

import { TeeShot, TeeResult } from "@/types/shot";
import { ClubSelector } from "./club-selector";
import { WindSelector } from "./wind-selector";
import { DirectionSelector } from "./direction-selector";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Target, TreePine, Waves, CircleX, AlertTriangle, Star, Ruler } from "lucide-react";

interface TeeShotInputProps {
  shot: TeeShot;
  onChange: (shot: TeeShot) => void;
  par?: number;
}

const TEE_RESULTS_DEFAULT: { value: TeeResult; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "fairway", label: "FW", icon: <Target className="w-4 h-4" />, color: "green" },
  { value: "rough", label: "ラフ", icon: <TreePine className="w-4 h-4" />, color: "yellow" },
  { value: "bunker", label: "バンカー", icon: <Waves className="w-4 h-4" />, color: "amber" },
  { value: "ob", label: "OB", icon: <CircleX className="w-4 h-4" />, color: "red" },
  { value: "penalty", label: "ペナ", icon: <AlertTriangle className="w-4 h-4" />, color: "orange" },
];

const TEE_RESULTS_PAR3: { value: TeeResult; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "fairway", label: "ON", icon: <Target className="w-4 h-4" />, color: "green" },
  { value: "rough", label: "外し", icon: <TreePine className="w-4 h-4" />, color: "yellow" },
  { value: "bunker", label: "バンカー", icon: <Waves className="w-4 h-4" />, color: "amber" },
  { value: "ob", label: "OB", icon: <CircleX className="w-4 h-4" />, color: "red" },
  { value: "penalty", label: "ペナ", icon: <AlertTriangle className="w-4 h-4" />, color: "orange" },
];

// Par3用: よく使う距離のプリセット (yd)
const TEE_DISTANCE_PRESETS = [80, 100, 120, 140, 160, 180];

const RATINGS = [1, 2, 3, 4, 5] as const;

export function TeeShotInput({ shot, onChange, par }: TeeShotInputProps) {
  const isPar3 = par === 3;
  const teeResults = isPar3 ? TEE_RESULTS_PAR3 : TEE_RESULTS_DEFAULT;

  return (
    <div className="space-y-5">
      {/* Par3用: 距離入力 */}
      {isPar3 && (
        <div>
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
            <Ruler className="w-4 h-4" /> 距離 (yd)
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={shot.distance ?? 0}
              onChange={(e) => onChange({ ...shot, distance: Number(e.target.value) || 0 })}
              className="w-24 text-center text-lg font-bold"
              min={0}
              max={300}
            />
            <span className="text-gray-500">yd</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {TEE_DISTANCE_PRESETS.map((dist) => (
              <button
                key={dist}
                type="button"
                onClick={() => onChange({ ...shot, distance: dist })}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  shot.distance === dist
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {dist}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* クラブ選択 */}
      <div>
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
          🏌️ クラブ
        </Label>
        <ClubSelector
          value={shot.club}
          onChange={(club) => onChange({ ...shot, club })}
          excludePutter
        />
      </div>

      {/* 結果 */}
      <div>
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
          📍 {isPar3 ? "結果" : "着弾地点"}
        </Label>
        <div className="grid grid-cols-5 gap-2">
          {teeResults.map((result) => (
            <button
              key={result.value}
              type="button"
              onClick={() => onChange({ ...shot, result: result.value })}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all",
                shot.result === result.value
                  ? result.color === "green"
                    ? "bg-green-500 text-white shadow-lg"
                    : result.color === "yellow"
                    ? "bg-yellow-500 text-white shadow-lg"
                    : result.color === "amber"
                    ? "bg-amber-500 text-white shadow-lg"
                    : result.color === "red"
                    ? "bg-red-500 text-white shadow-lg"
                    : "bg-orange-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {result.icon}
              <span className="text-xs mt-1 font-medium">{result.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 方向 */}
      <div>
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
          ↔️ 方向
        </Label>
        <DirectionSelector
          type="leftRight"
          value={shot.resultDirection}
          onChange={(v) => onChange({ ...shot, resultDirection: v as "left" | "center" | "right" })}
        />
      </div>

      {/* 風 */}
      <div>
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
          💨 風
        </Label>
        <WindSelector
          value={shot.wind}
          onChange={(wind) => onChange({ ...shot, wind })}
        />
      </div>

      {/* 5点採点 */}
      <div>
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
          <Star className="w-4 h-4" /> 自己評価
        </Label>
        <div className="flex justify-center gap-2">
          {RATINGS.map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange({ ...shot, rating })}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all",
                shot.rating === rating
                  ? "bg-yellow-400 text-yellow-900 shadow-lg ring-2 ring-yellow-500"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              {rating}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1 px-2">
          <span>悪い</span>
          <span>良い</span>
        </div>
      </div>

      {/* メモ */}
      <div>
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
          📝 メモ
        </Label>
        <Textarea
          value={shot.note}
          onChange={(e) => onChange({ ...shot, note: e.target.value })}
          placeholder="例: スライスが強かった、ダフった..."
          className="h-16 resize-none"
        />
      </div>
    </div>
  );
}
