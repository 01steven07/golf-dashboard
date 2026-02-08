"use client";

import { cn } from "@/lib/utils";

interface DirectionSelectorProps {
  value: string;
  onChange: (value: string) => void;
  type: "leftRight" | "eightDirection" | "puttResult";
  centerLabel?: string;
  prefix?: string;
}

// 8方向 + 中央のグリッド（風向きと同じUI）
export function DirectionSelector({ value, onChange, type, centerLabel = "OK", prefix = "" }: DirectionSelectorProps) {
  if (type === "leftRight") {
    return (
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => onChange("left")}
          className={cn(
            "w-16 h-12 rounded-l-full flex items-center justify-center text-sm font-medium transition-all",
            value === "left"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          ←左
        </button>
        <button
          type="button"
          onClick={() => onChange("center")}
          className={cn(
            "w-16 h-12 flex items-center justify-center text-sm font-medium transition-all",
            value === "center"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          中央
        </button>
        <button
          type="button"
          onClick={() => onChange("right")}
          className={cn(
            "w-16 h-12 rounded-r-full flex items-center justify-center text-sm font-medium transition-all",
            value === "right"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          右→
        </button>
      </div>
    );
  }

  // 8方向 + 中央（ショット結果・パット結果共通）
  const directions = [
    { id: "front-left", label: "↖️", position: "top-left" },
    { id: "front", label: "⬆️", position: "top-center" },
    { id: "front-right", label: "↗️", position: "top-right" },
    { id: "left", label: "⬅️", position: "middle-left" },
    { id: "center", label: centerLabel, position: "middle-center" },
    { id: "right", label: "➡️", position: "middle-right" },
    { id: "back-left", label: "↙️", position: "bottom-left" },
    { id: "back", label: "⬇️", position: "bottom-center" },
    { id: "back-right", label: "↘️", position: "bottom-right" },
  ];

  const getFullValue = (id: string) => prefix ? `${prefix}-${id}` : id;
  const getCurrentId = () => {
    if (!value) return "";
    if (prefix && value.startsWith(prefix + "-")) {
      return value.replace(prefix + "-", "");
    }
    return value;
  };

  const currentId = getCurrentId();
  const isGreen = type === "eightDirection" && prefix === "on";
  const isPutt = type === "puttResult";

  return (
    <div className="relative w-fit mx-auto">
      {/* ターゲット方向ラベル */}
      <div className="text-center text-xs text-gray-400 mb-1">
        {isPutt ? "🕳️ カップ" : "⛳ ピン"}
      </div>

      <div className="grid grid-cols-3 gap-1">
        {directions.map((dir) => {
          const isCenter = dir.id === "center";
          const isSelected = currentId === dir.id;

          return (
            <button
              key={dir.id}
              type="button"
              onClick={() => onChange(getFullValue(dir.id))}
              className={cn(
                "w-14 h-12 rounded-lg flex items-center justify-center text-sm font-medium transition-all",
                isCenter
                  ? isSelected
                    ? "bg-green-600 text-white ring-4 ring-green-200 shadow-lg rounded-full"
                    : "bg-green-100 text-green-700 hover:bg-green-200 rounded-full border-2 border-green-300"
                  : isSelected
                  ? isGreen
                    ? "bg-green-500 text-white shadow-md"
                    : isPutt
                    ? "bg-purple-500 text-white shadow-md"
                    : "bg-orange-500 text-white shadow-md"
                  : isGreen
                  ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                  : isPutt
                  ? "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                  : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
              )}
            >
              {dir.label}
            </button>
          );
        })}
      </div>

      {/* 自分の位置ラベル */}
      <div className="text-center text-xs text-gray-400 mt-1">
        🏌️ 自分
      </div>
    </div>
  );
}
