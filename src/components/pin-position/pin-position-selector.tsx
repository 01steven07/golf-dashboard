"use client";

import { cn } from "@/lib/utils";
import { Flag } from "lucide-react";
import type { PinPosition } from "@/types/shot";

interface PinPositionSelectorProps {
  value: PinPosition | null;
  onChange: (pos: PinPosition | null) => void;
  size?: "sm" | "md";
}

const positions: { id: PinPosition; label: string }[] = [
  { id: "back-left", label: "奥左" },
  { id: "back-center", label: "奥中" },
  { id: "back-right", label: "奥右" },
  { id: "middle-left", label: "左" },
  { id: "center", label: "中央" },
  { id: "middle-right", label: "右" },
  { id: "front-left", label: "手前左" },
  { id: "front-center", label: "手前" },
  { id: "front-right", label: "手前右" },
];

export function PinPositionSelector({
  value,
  onChange,
  size = "md",
}: PinPositionSelectorProps) {
  const handleClick = (pos: PinPosition) => {
    onChange(value === pos ? null : pos);
  };

  const cellSize = size === "sm" ? "h-8 text-[10px]" : "h-10 text-xs";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="text-[10px] text-gray-400 flex items-center gap-1">
        <Flag className="w-3 h-3" />
        奥
      </div>
      <div className="grid grid-cols-3 gap-0.5 w-full max-w-[240px]">
        {positions.map((pos) => {
          const isSelected = value === pos.id;
          return (
            <button
              key={pos.id}
              type="button"
              onClick={() => handleClick(pos.id)}
              className={cn(
                "rounded flex items-center justify-center font-medium transition-all",
                cellSize,
                isSelected
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
              )}
            >
              {isSelected && <Flag className="w-3 h-3 mr-0.5" />}
              {pos.label}
            </button>
          );
        })}
      </div>
      <div className="text-[10px] text-gray-400">🏌️ 手前</div>
    </div>
  );
}
