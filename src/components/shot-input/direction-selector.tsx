"use client";

import { cn } from "@/lib/utils";

interface DirectionSelectorProps {
  value: string;
  onChange: (value: string) => void;
  type: "leftRight" | "fullDirection" | "puttResult";
}

export function DirectionSelector({ value, onChange, type }: DirectionSelectorProps) {
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

  if (type === "puttResult") {
    return (
      <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
        {/* 上段: ショート */}
        <div className="col-start-2">
          <button
            type="button"
            onClick={() => onChange("short")}
            className={cn(
              "w-14 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
              value === "short"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            ショート
          </button>
        </div>
        {/* 中段: 左・カップイン・右 */}
        <button
          type="button"
          onClick={() => onChange("left")}
          className={cn(
            "w-14 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
            value === "left"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          ←左
        </button>
        <button
          type="button"
          onClick={() => onChange("in")}
          className={cn(
            "w-14 h-10 rounded-full flex items-center justify-center text-xs font-medium transition-all",
            value === "in"
              ? "bg-green-600 text-white ring-4 ring-green-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          🕳️ IN
        </button>
        <button
          type="button"
          onClick={() => onChange("right")}
          className={cn(
            "w-14 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
            value === "right"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          右→
        </button>
        {/* 下段: オーバー */}
        <div className="col-start-2">
          <button
            type="button"
            onClick={() => onChange("long")}
            className={cn(
              "w-14 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
              value === "long"
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            オーバー
          </button>
        </div>
      </div>
    );
  }

  // fullDirection - for shot results (グリーン周り)
  return (
    <div className="space-y-2">
      {/* グリーンON */}
      <div className="text-center mb-2">
        <span className="text-xs text-gray-500">グリーンON</span>
      </div>
      <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
        {/* 上段: 手前 */}
        <div className="col-start-2">
          <button
            type="button"
            onClick={() => onChange("on-front")}
            className={cn(
              "w-12 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
              value === "on-front"
                ? "bg-green-500 text-white"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            )}
          >
            手前
          </button>
        </div>
        {/* 中段 */}
        <button
          type="button"
          onClick={() => onChange("on-left")}
          className={cn(
            "w-12 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
            value === "on-left"
              ? "bg-green-500 text-white"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          )}
        >
          左
        </button>
        <button
          type="button"
          onClick={() => onChange("on-good")}
          className={cn(
            "w-12 h-10 rounded-full flex items-center justify-center text-xs font-medium transition-all",
            value === "on-good"
              ? "bg-green-600 text-white ring-4 ring-green-200"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          )}
        >
          ⛳ OK
        </button>
        <button
          type="button"
          onClick={() => onChange("on-right")}
          className={cn(
            "w-12 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
            value === "on-right"
              ? "bg-green-500 text-white"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          )}
        >
          右
        </button>
        {/* 下段: 奥 */}
        <div className="col-start-2">
          <button
            type="button"
            onClick={() => onChange("on-back")}
            className={cn(
              "w-12 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
              value === "on-back"
                ? "bg-green-500 text-white"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            )}
          >
            奥
          </button>
        </div>
      </div>

      {/* ミス */}
      <div className="text-center mt-4 mb-2">
        <span className="text-xs text-gray-500">グリーン外し</span>
      </div>
      <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
        <div className="col-start-2">
          <button
            type="button"
            onClick={() => onChange("miss-front")}
            className={cn(
              "w-12 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
              value === "miss-front"
                ? "bg-orange-500 text-white"
                : "bg-orange-100 text-orange-700 hover:bg-orange-200"
            )}
          >
            手前
          </button>
        </div>
        <button
          type="button"
          onClick={() => onChange("miss-left")}
          className={cn(
            "w-12 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
            value === "miss-left"
              ? "bg-orange-500 text-white"
              : "bg-orange-100 text-orange-700 hover:bg-orange-200"
          )}
        >
          左
        </button>
        <div className="w-12 h-10" /> {/* 空セル */}
        <button
          type="button"
          onClick={() => onChange("miss-right")}
          className={cn(
            "w-12 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
            value === "miss-right"
              ? "bg-orange-500 text-white"
              : "bg-orange-100 text-orange-700 hover:bg-orange-200"
          )}
        >
          右
        </button>
        <div className="col-start-2">
          <button
            type="button"
            onClick={() => onChange("miss-back")}
            className={cn(
              "w-12 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
              value === "miss-back"
                ? "bg-orange-500 text-white"
                : "bg-orange-100 text-orange-700 hover:bg-orange-200"
            )}
          >
            奥
          </button>
        </div>
      </div>

      {/* OB/ペナルティ */}
      <div className="flex justify-center gap-2 mt-4">
        <button
          type="button"
          onClick={() => onChange("ob-left")}
          className={cn(
            "px-3 py-2 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
            value === "ob-left"
              ? "bg-red-600 text-white"
              : "bg-red-100 text-red-700 hover:bg-red-200"
          )}
        >
          OB左
        </button>
        <button
          type="button"
          onClick={() => onChange("ob-right")}
          className={cn(
            "px-3 py-2 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
            value === "ob-right"
              ? "bg-red-600 text-white"
              : "bg-red-100 text-red-700 hover:bg-red-200"
          )}
        >
          OB右
        </button>
        <button
          type="button"
          onClick={() => onChange("penalty-left")}
          className={cn(
            "px-3 py-2 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
            value === "penalty-left"
              ? "bg-yellow-600 text-white"
              : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
          )}
        >
          ペナ左
        </button>
        <button
          type="button"
          onClick={() => onChange("penalty-right")}
          className={cn(
            "px-3 py-2 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
            value === "penalty-right"
              ? "bg-yellow-600 text-white"
              : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
          )}
        >
          ペナ右
        </button>
      </div>
    </div>
  );
}
