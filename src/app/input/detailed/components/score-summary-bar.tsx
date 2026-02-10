"use client";

import { cn } from "@/lib/utils";

interface SectionScore {
  name: string;
  score: number;
}

interface ScoreSummaryBarProps {
  sectionScores: SectionScore[];
  totalScore: number;
  totalPar: number;
  totalPutts: number;
}

export function ScoreSummaryBar({
  sectionScores,
  totalScore,
  totalPar,
  totalPutts,
}: ScoreSummaryBarProps) {
  const diff = totalScore - totalPar;

  return (
    <div
      className="grid gap-1 px-4 py-2 bg-green-50 text-center text-sm"
      style={{
        gridTemplateColumns: `repeat(${sectionScores.length + 3}, minmax(0, 1fr))`,
      }}
    >
      {sectionScores.map((section) => (
        <div key={section.name}>
          <div className="text-xs text-gray-500">{section.name}</div>
          <div className="font-bold text-green-700">
            {section.score || "-"}
          </div>
        </div>
      ))}
      <div>
        <div className="text-xs text-gray-500">TOTAL</div>
        <div className="font-bold text-lg text-green-800">
          {totalScore || "-"}
        </div>
      </div>
      <div>
        <div className="text-xs text-gray-500">±Par</div>
        <div
          className={cn(
            "font-bold",
            diff > 0
              ? "text-red-600"
              : diff < 0
                ? "text-blue-600"
                : "text-gray-600"
          )}
        >
          {totalScore ? (diff > 0 ? `+${diff}` : diff) : "-"}
        </div>
      </div>
      <div>
        <div className="text-xs text-gray-500">Putt</div>
        <div className="font-bold text-purple-700">
          {totalPutts || "-"}
        </div>
      </div>
    </div>
  );
}
