"use client";

import { useState, useEffect } from "react";
import { ShotResult } from "@/types/shot";
import { DirectionSelector } from "./direction-selector";
import { cn } from "@/lib/utils";
import { Circle, CircleX, AlertTriangle, Target } from "lucide-react";

interface ShotResultSelectorProps {
  value: ShotResult;
  onChange: (value: ShotResult) => void;
}

type ResultCategory = "on" | "miss" | "ob" | "penalty";

const CATEGORIES: { id: ResultCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "on", label: "グリーンON", icon: <Target className="w-5 h-5" />, color: "green" },
  { id: "miss", label: "外し", icon: <Circle className="w-5 h-5" />, color: "orange" },
  { id: "ob", label: "OB", icon: <CircleX className="w-5 h-5" />, color: "red" },
  { id: "penalty", label: "ペナルティ", icon: <AlertTriangle className="w-5 h-5" />, color: "yellow" },
];

// 結果値からカテゴリを取得
function getCategoryFromResult(result: ShotResult): ResultCategory {
  if (result.startsWith("on-")) return "on";
  if (result.startsWith("miss-")) return "miss";
  if (result.startsWith("ob-")) return "ob";
  if (result.startsWith("penalty-")) return "penalty";
  return "on";
}

export function ShotResultSelector({ value, onChange }: ShotResultSelectorProps) {
  const [category, setCategory] = useState<ResultCategory>(getCategoryFromResult(value));

  useEffect(() => {
    setCategory(getCategoryFromResult(value));
  }, [value]);

  const handleCategoryChange = (newCategory: ResultCategory) => {
    setCategory(newCategory);
    // カテゴリ変更時にデフォルト値を設定
    if (newCategory === "on") {
      onChange("on-good" as ShotResult);
    } else if (newCategory === "miss") {
      onChange("miss-front" as ShotResult);
    } else if (newCategory === "ob") {
      onChange("ob-left" as ShotResult);
    } else if (newCategory === "penalty") {
      onChange("penalty-left" as ShotResult);
    }
  };

  const handleDirectionChange = (direction: string) => {
    onChange(direction as ShotResult);
  };

  return (
    <div className="space-y-4">
      {/* カテゴリ選択 */}
      <div className="grid grid-cols-4 gap-2">
        {CATEGORIES.map((cat) => {
          const isSelected = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all",
                isSelected
                  ? cat.color === "green"
                    ? "bg-green-500 text-white shadow-lg ring-2 ring-green-300"
                    : cat.color === "orange"
                    ? "bg-orange-500 text-white shadow-lg ring-2 ring-orange-300"
                    : cat.color === "red"
                    ? "bg-red-500 text-white shadow-lg ring-2 ring-red-300"
                    : "bg-yellow-500 text-white shadow-lg ring-2 ring-yellow-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {cat.icon}
              <span className="text-xs mt-1 font-medium">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 方向選択（カテゴリに応じて表示） */}
      {(category === "on" || category === "miss") && (
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="text-center text-sm text-gray-600 mb-3">
            {category === "on" ? "グリーン上の位置" : "外した方向"}
          </div>
          <DirectionSelector
            type="eightDirection"
            value={value}
            onChange={handleDirectionChange}
            centerLabel={category === "on" ? "⛳OK" : ""}
            prefix={category}
          />
        </div>
      )}

      {/* OB/ペナルティは左右のみ */}
      {(category === "ob" || category === "penalty") && (
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="text-center text-sm text-gray-600 mb-3">
            {category === "ob" ? "OBの方向" : "ペナルティの方向"}
          </div>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => onChange(`${category}-left` as ShotResult)}
              className={cn(
                "px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-all",
                value === `${category}-left`
                  ? category === "ob"
                    ? "bg-red-500 text-white shadow-lg"
                    : "bg-yellow-500 text-white shadow-lg"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-400"
              )}
            >
              ⬅️ 左
            </button>
            <button
              type="button"
              onClick={() => onChange(`${category}-right` as ShotResult)}
              className={cn(
                "px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-all",
                value === `${category}-right`
                  ? category === "ob"
                    ? "bg-red-500 text-white shadow-lg"
                    : "bg-yellow-500 text-white shadow-lg"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-400"
              )}
            >
              右 ➡️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
