"use client";

import { cn } from "@/lib/utils";
import { HoleData } from "@/types/shot";
import { getHoleScore } from "@/utils/shot-aggregation";
import { getScoreSymbol } from "@/utils/golf-symbols";

interface HoleNavigationProps {
  holes: HoleData[];
  currentHole: number;
  onHoleSelect: (holeNumber: number) => void;
}

export function HoleNavigation({
  holes,
  currentHole,
  onHoleSelect,
}: HoleNavigationProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto">
      {holes.map((h) => {
        const holeScore = getHoleScore(h);
        const scoreDiff = holeScore - h.par;
        const scoreSymbol = holeScore === 0 ? "" : getScoreSymbol(holeScore, h.par).symbol;

        return (
          <button
            key={h.holeNumber}
            onClick={() => onHoleSelect(h.holeNumber)}
            className={cn(
              "flex-shrink-0 min-w-[2.5rem] h-10 px-1 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center",
              currentHole === h.holeNumber
                ? "bg-green-600 text-white shadow-md"
                : holeScore === 0
                  ? "bg-gray-100 text-gray-500"
                  : scoreDiff < 0
                    ? "bg-blue-100 text-blue-700"
                    : scoreDiff === 0
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
            )}
          >
            <span>{h.holeNumber}</span>
            {holeScore > 0 && (
              <span className="text-[10px] leading-none">{scoreSymbol}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
