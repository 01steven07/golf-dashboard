"use client";

import { cn } from "@/lib/utils";
import { Score } from "@/types/database";
import { getScoreSymbol } from "@/utils/golf-symbols";

interface HoleSelectorProps {
  scores: Score[];
  selectedHole: number;
  onSelect: (holeNumber: number) => void;
}

export function HoleSelector({ scores, selectedHole, onSelect }: HoleSelectorProps) {
  const sorted = [...scores].sort((a, b) => a.hole_number - b.hole_number);

  return (
    <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto">
      {sorted.map((s) => {
        const diff = s.score - s.par;
        const symbol = getScoreSymbol(s.score, s.par).symbol;
        const isSelected = selectedHole === s.hole_number;

        return (
          <button
            key={s.hole_number}
            onClick={() => onSelect(s.hole_number)}
            className={cn(
              "flex-shrink-0 min-w-[2.5rem] h-10 px-1 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center",
              isSelected
                ? "bg-green-600 text-white shadow-md"
                : diff < 0
                  ? "bg-blue-100 text-blue-700"
                  : diff === 0
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
            )}
          >
            <span>{s.hole_number}</span>
            <span className="text-[10px] leading-none">{symbol}</span>
          </button>
        );
      })}
    </div>
  );
}
