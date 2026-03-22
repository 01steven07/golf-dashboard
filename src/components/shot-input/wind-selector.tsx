"use client";

import { WindDirection } from "@/types/shot";
import { cn } from "@/lib/utils";
import { Wind } from "lucide-react";

interface WindSelectorProps {
  value: WindDirection;
  onChange: (value: WindDirection) => void;
}

// 風の矢印は「風が吹いてくる方向」を示す
// ゴルファーは中央、ターゲット（グリーン）は上方向
const WIND_ROTATIONS: Record<Exclude<WindDirection, "none">, string> = {
  follow: "-rotate-90",
  against: "rotate-90",
  left: "rotate-0",
  right: "rotate-180",
  "follow-left": "-rotate-45",
  "follow-right": "-rotate-[135deg]",
  "against-left": "rotate-45",
  "against-right": "rotate-[135deg]",
};

export function WindSelector({ value, onChange }: WindSelectorProps) {
  return (
    <div className="relative w-fit mx-auto">
      {/* ターゲット方向ラベル */}
      <div className="text-center text-xs text-gray-400 mb-1">⛳ ターゲット</div>

      {/* 背景の方向ガイド */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-200" />
        </div>

        <div className="grid grid-cols-3 gap-1">
          {/* 上段: アゲ左、アゲンスト、アゲ右 */}
          <button
            type="button"
            onClick={() => onChange("against-left")}
            className={cn(
              "w-16 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "against-left"
                ? "bg-blue-500 text-white"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            )}
          >
            <Wind className={cn("w-4 h-4", WIND_ROTATIONS["against-left"])} />
            <span>アゲ左</span>
          </button>
          <button
            type="button"
            onClick={() => onChange("against")}
            className={cn(
              "w-16 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "against"
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            )}
          >
            <Wind className={cn("w-4 h-4", WIND_ROTATIONS["against"])} />
            <span>アゲンスト</span>
          </button>
          <button
            type="button"
            onClick={() => onChange("against-right")}
            className={cn(
              "w-16 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "against-right"
                ? "bg-blue-500 text-white"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            )}
          >
            <Wind className={cn("w-4 h-4", WIND_ROTATIONS["against-right"])} />
            <span>アゲ右</span>
          </button>

          {/* 中段: 左から、無風（中央）、右から */}
          <button
            type="button"
            onClick={() => onChange("left")}
            className={cn(
              "w-16 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "left" ? "bg-sky-500 text-white" : "bg-sky-50 text-sky-700 hover:bg-sky-100"
            )}
          >
            <Wind className={cn("w-4 h-4", WIND_ROTATIONS["left"])} />
            <span>左から</span>
          </button>
          <button
            type="button"
            onClick={() => onChange("none")}
            className={cn(
              "w-16 h-12 rounded-full flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "none"
                ? "bg-gray-600 text-white ring-2 ring-gray-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
            )}
          >
            <span>無風</span>
          </button>
          <button
            type="button"
            onClick={() => onChange("right")}
            className={cn(
              "w-16 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "right"
                ? "bg-sky-500 text-white"
                : "bg-sky-50 text-sky-700 hover:bg-sky-100"
            )}
          >
            <Wind className={cn("w-4 h-4", WIND_ROTATIONS["right"])} />
            <span>右から</span>
          </button>

          {/* 下段: フォロー左、フォロー、フォロー右 */}
          <button
            type="button"
            onClick={() => onChange("follow-left")}
            className={cn(
              "w-16 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "follow-left"
                ? "bg-emerald-500 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            )}
          >
            <Wind className={cn("w-4 h-4", WIND_ROTATIONS["follow-left"])} />
            <span>フォ左</span>
          </button>
          <button
            type="button"
            onClick={() => onChange("follow")}
            className={cn(
              "w-16 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "follow"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            )}
          >
            <Wind className={cn("w-4 h-4", WIND_ROTATIONS["follow"])} />
            <span>フォロー</span>
          </button>
          <button
            type="button"
            onClick={() => onChange("follow-right")}
            className={cn(
              "w-16 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "follow-right"
                ? "bg-emerald-500 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            )}
          >
            <Wind className={cn("w-4 h-4", WIND_ROTATIONS["follow-right"])} />
            <span>フォ右</span>
          </button>
        </div>
      </div>

      {/* 自分の位置ラベル */}
      <div className="text-center text-xs text-gray-400 mt-1">🏌️ 自分</div>
    </div>
  );
}
