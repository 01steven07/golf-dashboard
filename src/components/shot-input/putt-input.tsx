"use client";

import { PuttShot, PuttSlope, PuttBreak, PuttResult, OptionalFieldSettings } from "@/types/shot";
import { DirectionSelector } from "./direction-selector";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Star, Ruler, TrendingUp, Check } from "lucide-react";

interface PuttInputProps {
  shot: PuttShot;
  onChange: (shot: PuttShot) => void;
  puttNumber: number;
  optionalFields?: OptionalFieldSettings;
}

const SLOPES: { value: PuttSlope; label: string; icon: string }[] = [
  { value: "uphill", label: "上り", icon: "📈" },
  { value: "flat", label: "フラット", icon: "➖" },
  { value: "downhill", label: "下り", icon: "📉" },
];

const BREAKS: { value: PuttBreak; label: string; icon: string }[] = [
  { value: "hook", label: "フック", icon: "↩️" },
  { value: "straight", label: "ストレート", icon: "⬆️" },
  { value: "slice", label: "スライス", icon: "↪️" },
];

const RATINGS = [1, 2, 3, 4, 5] as const;

// よく使う距離のプリセット（メートル）
const DISTANCE_PRESETS = [1, 2, 3, 5, 7, 10];

export function PuttInput({ shot, onChange, puttNumber, optionalFields }: PuttInputProps) {
  const isOk = shot.note === "OK";

  // 8方向の結果からセンター（IN）かどうか判定
  const isIn = shot.result === "in";

  const handleOkToggle = () => {
    if (isOk) {
      onChange({ ...shot, note: "" });
    } else {
      onChange({ ...shot, result: "in", distance: 1, note: "OK" });
    }
  };

  const handleResultChange = (direction: string) => {
    // direction-selectorからの値をPuttResultに変換
    if (direction === "center" || direction === "in") {
      onChange({ ...shot, result: "in" });
    } else {
      onChange({ ...shot, result: direction as PuttResult });
    }
  };

  return (
    <div className="space-y-5">
      {/* OKパットトグル */}
      <button
        type="button"
        onClick={handleOkToggle}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all",
          isOk
            ? "bg-purple-500 text-white shadow-md"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        )}
      >
        <Check className="w-4 h-4" />
        OKパット
      </button>

      {isOk ? (
        <div className="text-center text-sm text-purple-600">
          1m カップイン
        </div>
      ) : (<>
      {/* 距離 */}
      {optionalFields?.puttDistance !== false && (
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
      )}

      {/* ライン選択（傾斜と曲がり） */}
      {optionalFields?.puttLine !== false && (
        <div>
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" /> ライン
          </Label>
          <div className="p-4 bg-gray-50 rounded-xl space-y-4">
            {/* 傾斜 */}
            <div>
              <div className="text-xs text-gray-500 mb-2 text-center">傾斜</div>
              <div className="flex justify-center gap-2">
                {SLOPES.map((slope) => (
                  <button
                    key={slope.value}
                    type="button"
                    onClick={() => onChange({ ...shot, slope: slope.value })}
                    className={cn(
                      "flex flex-col items-center justify-center px-4 py-3 rounded-xl transition-all",
                      shot.slope === slope.value
                        ? slope.value === "uphill"
                          ? "bg-blue-500 text-white shadow-md"
                          : slope.value === "downhill"
                          ? "bg-red-500 text-white shadow-md"
                          : "bg-gray-500 text-white shadow-md"
                        : "bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-400"
                    )}
                  >
                    <span className="text-lg">{slope.icon}</span>
                    <span className="text-xs mt-1 font-medium">{slope.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 曲がり */}
            <div>
              <div className="text-xs text-gray-500 mb-2 text-center">曲がり</div>
              <div className="flex justify-center gap-2">
                {BREAKS.map((brk) => (
                  <button
                    key={brk.value}
                    type="button"
                    onClick={() => onChange({ ...shot, break: brk.value })}
                    className={cn(
                      "flex flex-col items-center justify-center px-4 py-3 rounded-xl transition-all",
                      shot.break === brk.value
                        ? brk.value === "hook"
                          ? "bg-orange-500 text-white shadow-md"
                          : brk.value === "slice"
                          ? "bg-orange-500 text-white shadow-md"
                          : "bg-green-500 text-white shadow-md"
                        : "bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-400"
                    )}
                  >
                    <span className="text-lg">{brk.icon}</span>
                    <span className="text-xs mt-1 font-medium">{brk.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 現在の選択表示 */}
            <div className="text-center text-sm text-gray-600 pt-2 border-t">
              選択中:
              <span className="font-bold ml-1">
                {SLOPES.find(s => s.value === shot.slope)?.label} × {BREAKS.find(b => b.value === shot.break)?.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 結果（8方向 + IN） */}
      <div>
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
          🕳️ 結果
        </Label>
        <DirectionSelector
          type="puttResult"
          value={isIn ? "center" : shot.result}
          onChange={handleResultChange}
          centerLabel="🕳️IN"
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
      </>)}
    </div>
  );
}
