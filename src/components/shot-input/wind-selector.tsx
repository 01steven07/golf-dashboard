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
// フォロー = 後ろから風 = 矢印は上向き（ターゲット方向へ吹く）
// アゲンスト = 前から風 = 矢印は下向き（自分に向かって吹く）
const WIND_ROTATIONS: Record<WindDirection, string> = {
  none: "",
  follow: "-rotate-90",      // ↑ 上向き（後ろから前へ）
  against: "rotate-90",      // ↓ 下向き（前から後ろへ）
  left: "rotate-0",          // → 右向き（左から右へ）
  right: "rotate-180",       // ← 左向き（右から左へ）
  "follow-left": "-rotate-45",   // ↗ 右上向き
  "follow-right": "-rotate-[135deg]", // ↖ 左上向き
  "against-left": "rotate-45",   // ↘ 右下向き
  "against-right": "rotate-[135deg]", // ↙ 左下向き
};

export function WindSelector({ value, onChange }: WindSelectorProps) {
  return (
    <div className="space-y-2">
      {/* 無風 */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => onChange("none")}
          className={cn(
            "px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all",
            value === "none"
              ? "bg-gray-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          無風
        </button>
      </div>

      {/* 方向選択グリッド */}
      <div className="relative w-fit mx-auto">
        {/* 背景の方向ガイド */}
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

          {/* 中段: 左から、(ゴルファー)、右から */}
          <button
            type="button"
            onClick={() => onChange("left")}
            className={cn(
              "w-16 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "left"
                ? "bg-sky-500 text-white"
                : "bg-sky-50 text-sky-700 hover:bg-sky-100"
            )}
          >
            <Wind className={cn("w-4 h-4", WIND_ROTATIONS["left"])} />
            <span>左から</span>
          </button>
          <div className="w-16 h-12 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg">
              🏌️
            </div>
          </div>
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

        {/* ターゲット方向の矢印 */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 flex flex-col items-center">
          <span>⛳ ターゲット</span>
        </div>
      </div>
    </div>
  );
}
