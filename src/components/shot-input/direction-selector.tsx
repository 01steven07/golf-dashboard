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
      <div className="relative w-fit mx-auto pt-2">
        {/* カップを中心とした結果表示 */}
        <div className="grid grid-cols-3 gap-1.5">
          {/* 上段: ショート */}
          <div />
          <button
            type="button"
            onClick={() => onChange("short")}
            className={cn(
              "w-16 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "short"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            )}
          >
            <span className="text-lg">⬇️</span>
            <span>ショート</span>
          </button>
          <div />

          {/* 中段: 左・カップイン・右 */}
          <button
            type="button"
            onClick={() => onChange("left")}
            className={cn(
              "w-16 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "left"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-orange-50 text-orange-700 hover:bg-orange-100"
            )}
          >
            <span className="text-lg">⬅️</span>
            <span>左</span>
          </button>
          <button
            type="button"
            onClick={() => onChange("in")}
            className={cn(
              "w-16 h-12 rounded-full flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "in"
                ? "bg-green-600 text-white ring-4 ring-green-200 shadow-lg"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            )}
          >
            <span className="text-lg">🕳️</span>
            <span>IN!</span>
          </button>
          <button
            type="button"
            onClick={() => onChange("right")}
            className={cn(
              "w-16 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "right"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-orange-50 text-orange-700 hover:bg-orange-100"
            )}
          >
            <span className="text-lg">➡️</span>
            <span>右</span>
          </button>

          {/* 下段: オーバー */}
          <div />
          <button
            type="button"
            onClick={() => onChange("long")}
            className={cn(
              "w-16 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "long"
                ? "bg-red-500 text-white shadow-md"
                : "bg-red-50 text-red-700 hover:bg-red-100"
            )}
          >
            <span className="text-lg">⬆️</span>
            <span>オーバー</span>
          </button>
          <div />
        </div>
      </div>
    );
  }

  // fullDirection - グリーン周りの8方向 + 中央
  return (
    <div className="space-y-4">
      {/* グリーンON - 8方向グリッド */}
      <div>
        <div className="text-center mb-2">
          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
            ✓ グリーンON
          </span>
        </div>
        <div className="relative w-fit mx-auto">
          {/* グリーンの形を表現 */}
          <div className="absolute inset-2 rounded-full bg-green-100 opacity-50 pointer-events-none" />

          <div className="grid grid-cols-3 gap-1">
            {/* 上段: 左奥、奥、右奥 */}
            <button
              type="button"
              onClick={() => onChange("on-left")}
              className={cn(
                "w-14 h-11 rounded-tl-2xl flex flex-col items-center justify-center text-xs font-medium transition-all z-10",
                value === "on-left"
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
              )}
            >
              ↖️ 左
            </button>
            <button
              type="button"
              onClick={() => onChange("on-back")}
              className={cn(
                "w-14 h-11 rounded-t-xl flex flex-col items-center justify-center text-xs font-medium transition-all z-10",
                value === "on-back"
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
              )}
            >
              ⬆️ 奥
            </button>
            <button
              type="button"
              onClick={() => onChange("on-right")}
              className={cn(
                "w-14 h-11 rounded-tr-2xl flex flex-col items-center justify-center text-xs font-medium transition-all z-10",
                value === "on-right"
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
              )}
            >
              ↗️ 右
            </button>

            {/* 中段: 左、ピン、右 (手前よりの左右はなし) */}
            <div className="w-14 h-11" />
            <button
              type="button"
              onClick={() => onChange("on-good")}
              className={cn(
                "w-14 h-11 rounded-full flex flex-col items-center justify-center text-xs font-medium transition-all z-10",
                value === "on-good"
                  ? "bg-green-600 text-white ring-4 ring-green-300 shadow-lg"
                  : "bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300"
              )}
            >
              ⛳ OK
            </button>
            <div className="w-14 h-11" />

            {/* 下段: 手前 */}
            <div className="w-14 h-11" />
            <button
              type="button"
              onClick={() => onChange("on-front")}
              className={cn(
                "w-14 h-11 rounded-b-xl flex flex-col items-center justify-center text-xs font-medium transition-all z-10",
                value === "on-front"
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
              )}
            >
              ⬇️ 手前
            </button>
            <div className="w-14 h-11" />
          </div>

          {/* ピン位置の表示 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-1 h-1 rounded-full bg-red-500" />
          </div>
        </div>
      </div>

      {/* グリーン外し - 8方向グリッド */}
      <div>
        <div className="text-center mb-2">
          <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded-full">
            △ グリーン外し
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
          {/* 上段: 左奥方向外し、奥外し、右奥方向外し */}
          <button
            type="button"
            onClick={() => onChange("miss-left")}
            className={cn(
              "w-14 h-11 rounded-tl-2xl flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "miss-left"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
            )}
          >
            ↖️ 左
          </button>
          <button
            type="button"
            onClick={() => onChange("miss-back")}
            className={cn(
              "w-14 h-11 rounded-t-xl flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "miss-back"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
            )}
          >
            ⬆️ 奥
          </button>
          <button
            type="button"
            onClick={() => onChange("miss-right")}
            className={cn(
              "w-14 h-11 rounded-tr-2xl flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "miss-right"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
            )}
          >
            ↗️ 右
          </button>

          {/* 中段: 空 */}
          <div className="w-14 h-11" />
          <div className="w-14 h-11 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-xs text-green-600">
              GR
            </div>
          </div>
          <div className="w-14 h-11" />

          {/* 下段: 手前 */}
          <div className="w-14 h-11" />
          <button
            type="button"
            onClick={() => onChange("miss-front")}
            className={cn(
              "w-14 h-11 rounded-b-xl flex flex-col items-center justify-center text-xs font-medium transition-all",
              value === "miss-front"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
            )}
          >
            ⬇️ 手前
          </button>
          <div className="w-14 h-11" />
        </div>
      </div>

      {/* OB/ペナルティ */}
      <div>
        <div className="text-center mb-2">
          <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">
            ✕ OB / ペナルティ
          </span>
        </div>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => onChange("ob-left")}
            className={cn(
              "px-4 py-2.5 rounded-xl flex items-center gap-1 text-xs font-medium transition-all",
              value === "ob-left"
                ? "bg-red-600 text-white shadow-md"
                : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
            )}
          >
            ⬅️ OB左
          </button>
          <button
            type="button"
            onClick={() => onChange("ob-right")}
            className={cn(
              "px-4 py-2.5 rounded-xl flex items-center gap-1 text-xs font-medium transition-all",
              value === "ob-right"
                ? "bg-red-600 text-white shadow-md"
                : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
            )}
          >
            OB右 ➡️
          </button>
        </div>
        <div className="flex justify-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => onChange("penalty-left")}
            className={cn(
              "px-4 py-2.5 rounded-xl flex items-center gap-1 text-xs font-medium transition-all",
              value === "penalty-left"
                ? "bg-yellow-600 text-white shadow-md"
                : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200"
            )}
          >
            ⬅️ ペナ左
          </button>
          <button
            type="button"
            onClick={() => onChange("penalty-right")}
            className={cn(
              "px-4 py-2.5 rounded-xl flex items-center gap-1 text-xs font-medium transition-all",
              value === "penalty-right"
                ? "bg-yellow-600 text-white shadow-md"
                : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200"
            )}
          >
            ペナ右 ➡️
          </button>
        </div>
      </div>
    </div>
  );
}
