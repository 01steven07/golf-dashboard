"use client";

import { useState, useEffect } from "react";
import { ShotLie } from "@/types/shot";
import { cn } from "@/lib/utils";
import { Target, TreePine, Waves } from "lucide-react";

interface LieSelectorProps {
  value: ShotLie;
  onChange: (value: ShotLie) => void;
}

type LieType = "fairway" | "rough" | "bunker";

const LIE_TYPES: { id: LieType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "fairway", label: "フェアウェイ", icon: <Target className="w-5 h-5" />, color: "green" },
  { id: "rough", label: "ラフ", icon: <TreePine className="w-5 h-5" />, color: "yellow" },
  { id: "bunker", label: "バンカー", icon: <Waves className="w-5 h-5" />, color: "amber" },
];

// ライ値からタイプを取得
function getLieType(lie: ShotLie): LieType {
  if (lie === "fairway") return "fairway";
  if (lie.includes("rough")) return "rough";
  if (lie.includes("bunker")) return "bunker";
  return "fairway";
}

// ライ値から方向を取得
function getLieDirection(lie: ShotLie): "left" | "center" | "right" {
  if (lie.startsWith("left-")) return "left";
  if (lie.startsWith("right-")) return "right";
  return "center";
}

export function LieSelector({ value, onChange }: LieSelectorProps) {
  const [lieType, setLieType] = useState<LieType>(getLieType(value));
  const [direction, setDirection] = useState<"left" | "center" | "right">(getLieDirection(value));

  useEffect(() => {
    setLieType(getLieType(value));
    setDirection(getLieDirection(value));
  }, [value]);

  const handleTypeChange = (newType: LieType) => {
    setLieType(newType);
    if (newType === "fairway") {
      onChange("fairway");
    } else {
      // デフォルトで中央（左でも右でもない）を選択
      // ただし、rough/bunkerには中央がないので左をデフォルトに
      onChange(`left-${newType}` as ShotLie);
      setDirection("left");
    }
  };

  const handleDirectionChange = (newDirection: "left" | "center" | "right") => {
    setDirection(newDirection);
    if (lieType === "fairway") {
      onChange("fairway");
    } else {
      onChange(`${newDirection}-${lieType}` as ShotLie);
    }
  };

  return (
    <div className="space-y-4">
      {/* ライタイプ選択 */}
      <div className="grid grid-cols-3 gap-2">
        {LIE_TYPES.map((type) => {
          const isSelected = lieType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => handleTypeChange(type.id)}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl transition-all",
                isSelected
                  ? type.color === "green"
                    ? "bg-green-500 text-white shadow-lg ring-2 ring-green-300"
                    : type.color === "yellow"
                    ? "bg-yellow-500 text-white shadow-lg ring-2 ring-yellow-300"
                    : "bg-amber-500 text-white shadow-lg ring-2 ring-amber-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {type.icon}
              <span className="text-sm mt-1 font-medium">{type.label}</span>
            </button>
          );
        })}
      </div>

      {/* 方向選択（フェアウェイ以外の場合） */}
      {lieType !== "fairway" && (
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="text-center text-sm text-gray-600 mb-3">
            {lieType === "rough" ? "ラフの位置" : "バンカーの位置"}
          </div>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setDirection("left");
                onChange(`left-${lieType}` as ShotLie);
              }}
              className={cn(
                "px-6 py-3 rounded-xl font-medium transition-all",
                direction === "left"
                  ? lieType === "rough"
                    ? "bg-yellow-500 text-white shadow-lg"
                    : "bg-amber-500 text-white shadow-lg"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-400"
              )}
            >
              ⬅️ 左
            </button>
            <button
              type="button"
              onClick={() => {
                setDirection("right");
                onChange(`right-${lieType}` as ShotLie);
              }}
              className={cn(
                "px-6 py-3 rounded-xl font-medium transition-all",
                direction === "right"
                  ? lieType === "rough"
                    ? "bg-yellow-500 text-white shadow-lg"
                    : "bg-amber-500 text-white shadow-lg"
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
