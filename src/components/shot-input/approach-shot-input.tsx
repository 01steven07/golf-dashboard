"use client";

import { ApproachShot, ShotLie, Slope } from "@/types/shot";
import { ClubSelector } from "./club-selector";
import { WindSelector } from "./wind-selector";
import { DirectionSelector } from "./direction-selector";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Star, Ruler, Mountain, TreePine, Waves } from "lucide-react";

interface ApproachShotInputProps {
  shot: ApproachShot;
  onChange: (shot: ApproachShot) => void;
  shotNumber: number;
}

const LIES: { value: ShotLie; label: string; icon: React.ReactNode }[] = [
  { value: "fairway", label: "FW", icon: "🟢" },
  { value: "left-rough", label: "左ラフ", icon: <TreePine className="w-4 h-4" /> },
  { value: "right-rough", label: "右ラフ", icon: <TreePine className="w-4 h-4" /> },
  { value: "left-bunker", label: "左バンカー", icon: <Waves className="w-4 h-4" /> },
  { value: "right-bunker", label: "右バンカー", icon: <Waves className="w-4 h-4" /> },
];

const SLOPES: { value: Slope; label: string; icon: string }[] = [
  { value: "flat", label: "フラット", icon: "➖" },
  { value: "uphill", label: "つま先↑", icon: "⬆️" },
  { value: "downhill", label: "つま先↓", icon: "⬇️" },
  { value: "left", label: "左足↑", icon: "↖️" },
  { value: "right", label: "左足↓", icon: "↘️" },
];

const RATINGS = [1, 2, 3, 4, 5] as const;

// よく使う距離のプリセット
const DISTANCE_PRESETS = [50, 80, 100, 120, 150, 180];

export function ApproachShotInput({ shot, onChange, shotNumber }: ApproachShotInputProps) {
  return (
    <div className="space-y-5">
      {/* 残り距離 */}
      <div>
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
          <Ruler className="w-4 h-4" /> 残り距離 (yd)
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={shot.distance}
            onChange={(e) => onChange({ ...shot, distance: Number(e.target.value) || 0 })}
            className="w-24 text-center text-lg font-bold"
            min={0}
            max={600}
          />
          <span className="text-gray-500">yd</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {DISTANCE_PRESETS.map((dist) => (
            <button
              key={dist}
              type="button"
              onClick={() => onChange({ ...shot, distance: dist })}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                shot.distance === dist
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {dist}
            </button>
          ))}
        </div>
      </div>

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

      {/* ライ */}
      <div>
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
          📍 ライ
        </Label>
        <div className="grid grid-cols-5 gap-1.5">
          {LIES.map((lie) => (
            <button
              key={lie.value}
              type="button"
              onClick={() => onChange({ ...shot, lie: lie.value })}
              className={cn(
                "flex flex-col items-center justify-center p-2.5 rounded-xl transition-all text-xs",
                shot.lie === lie.value
                  ? lie.value === "fairway"
                    ? "bg-green-500 text-white shadow-md"
                    : lie.value.includes("rough")
                    ? "bg-yellow-500 text-white shadow-md"
                    : "bg-amber-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <span className="text-base">{typeof lie.icon === "string" ? lie.icon : lie.icon}</span>
              <span className="mt-0.5 font-medium leading-tight">{lie.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 傾斜 */}
      <div>
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
          <Mountain className="w-4 h-4" /> 傾斜
        </Label>
        <div className="grid grid-cols-5 gap-1.5">
          {SLOPES.map((slope) => (
            <button
              key={slope.value}
              type="button"
              onClick={() => onChange({ ...shot, slope: slope.value })}
              className={cn(
                "flex flex-col items-center justify-center p-2.5 rounded-xl transition-all",
                shot.slope === slope.value
                  ? "bg-purple-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <span className="text-base">{slope.icon}</span>
              <span className="text-xs mt-0.5 font-medium">{slope.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 結果（グリーン周りの方向選択） */}
      <div>
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
          🎯 結果
        </Label>
        <DirectionSelector
          type="fullDirection"
          value={shot.result}
          onChange={(v) => onChange({ ...shot, result: v as ApproachShot["result"] })}
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
          placeholder="例: ダフった、トップした、風を読み違えた..."
          className="h-16 resize-none"
        />
      </div>
    </div>
  );
}
