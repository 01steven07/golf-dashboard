"use client";

import { WindDirection } from "@/types/shot";
import { cn } from "@/lib/utils";
import { Wind } from "lucide-react";

interface WindSelectorProps {
  value: WindDirection;
  onChange: (value: WindDirection) => void;
}

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
      <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
        {/* 上段: アゲ左、アゲンスト、アゲ右 */}
        <button
          type="button"
          onClick={() => onChange("against-left")}
          className={cn(
            "w-14 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
            value === "against-left"
              ? "bg-blue-500 text-white"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          )}
        >
          <Wind className="w-4 h-4 rotate-[225deg]" />
          <span>アゲ左</span>
        </button>
        <button
          type="button"
          onClick={() => onChange("against")}
          className={cn(
            "w-14 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
            value === "against"
              ? "bg-blue-600 text-white"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          )}
        >
          <Wind className="w-4 h-4 rotate-180" />
          <span>アゲンスト</span>
        </button>
        <button
          type="button"
          onClick={() => onChange("against-right")}
          className={cn(
            "w-14 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
            value === "against-right"
              ? "bg-blue-500 text-white"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          )}
        >
          <Wind className="w-4 h-4 rotate-[135deg]" />
          <span>アゲ右</span>
        </button>

        {/* 中段: 左から、(中央空き)、右から */}
        <button
          type="button"
          onClick={() => onChange("left")}
          className={cn(
            "w-14 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
            value === "left"
              ? "bg-sky-500 text-white"
              : "bg-sky-50 text-sky-700 hover:bg-sky-100"
          )}
        >
          <Wind className="w-4 h-4 -rotate-90" />
          <span>左から</span>
        </button>
        <div className="w-14 h-12 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">
            🏌️
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange("right")}
          className={cn(
            "w-14 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
            value === "right"
              ? "bg-sky-500 text-white"
              : "bg-sky-50 text-sky-700 hover:bg-sky-100"
          )}
        >
          <Wind className="w-4 h-4 rotate-90" />
          <span>右から</span>
        </button>

        {/* 下段: フォロー左、フォロー、フォロー右 */}
        <button
          type="button"
          onClick={() => onChange("follow-left")}
          className={cn(
            "w-14 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
            value === "follow-left"
              ? "bg-emerald-500 text-white"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          )}
        >
          <Wind className="w-4 h-4 -rotate-45" />
          <span>フォ左</span>
        </button>
        <button
          type="button"
          onClick={() => onChange("follow")}
          className={cn(
            "w-14 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
            value === "follow"
              ? "bg-emerald-600 text-white"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          )}
        >
          <Wind className="w-4 h-4" />
          <span>フォロー</span>
        </button>
        <button
          type="button"
          onClick={() => onChange("follow-right")}
          className={cn(
            "w-14 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all",
            value === "follow-right"
              ? "bg-emerald-500 text-white"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          )}
        >
          <Wind className="w-4 h-4 rotate-45" />
          <span>フォ右</span>
        </button>
      </div>
    </div>
  );
}
