"use client";

import { PuttShot, PuttLine } from "@/types/shot";
import { DirectionSelector } from "./direction-selector";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Star, Ruler, MoveRight } from "lucide-react";

interface PuttInputProps {
  shot: PuttShot;
  onChange: (shot: PuttShot) => void;
  puttNumber: number;
}

const PUTT_LINES: { value: PuttLine; label: string; icon: string }[] = [
  { value: "straight", label: "ストレート", icon: "⬆️" },
  { value: "left-to-right", label: "スライス", icon: "↗️" },
  { value: "right-to-left", label: "フック", icon: "↖️" },
  { value: "uphill", label: "上り", icon: "📈" },
  { value: "downhill", label: "下り", icon: "📉" },
];

const RATINGS = [1, 2, 3, 4, 5] as const;

// よく使う距離のプリセット（メートル）
const DISTANCE_PRESETS = [1, 2, 3, 5, 7, 10];

export function PuttInput({ shot, onChange, puttNumber }: PuttInputProps) {
  return (
    <div className="space-y-5">
      {/* 距離 */}
      <div>
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
          <Ruler className="w-4 h-4" /> 距離 (m)
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={shot.distance}
            onChange={(e) => onChange({ ...shot, distance: Number(e.target.value) || 0 })}
            className="w-20 text-center text-lg font-bold"
            min={0}
            max={50}
            step={0.5}
          />
          <span className="text-gray-500">m</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {DISTANCE_PRESETS.map((dist) => (
            <button
              key={dist}
              type="button"
              onClick={() => onChange({ ...shot, distance: dist })}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                shot.distance === dist
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {dist}m
            </button>
          ))}
        </div>
      </div>

      {/* ライン */}
      <div>
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
          <MoveRight className="w-4 h-4" /> ライン
        </Label>
        <div className="grid grid-cols-5 gap-1.5">
          {PUTT_LINES.map((line) => (
            <button
              key={line.value}
              type="button"
              onClick={() => onChange({ ...shot, line: line.value })}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all",
                shot.line === line.value
                  ? "bg-purple-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <span className="text-lg">{line.icon}</span>
              <span className="text-xs mt-1 font-medium">{line.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 結果（パット専用のグリッド） */}
      <div>
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
          🕳️ 結果
        </Label>
        <DirectionSelector
          type="puttResult"
          value={shot.result}
          onChange={(v) => onChange({ ...shot, result: v as PuttShot["result"] })}
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
          placeholder="例: 読み違い、タッチが弱い..."
          className="h-16 resize-none"
        />
      </div>
    </div>
  );
}
