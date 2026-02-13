"use client";

import { Score } from "@/types/database";
import { calculateScoreDistribution, ScoreDistribution } from "@/utils/course-stats";

interface ScoreDistributionChartProps {
  scores: Score[];
}

const DISTRIBUTION_ITEMS: {
  key: keyof Omit<ScoreDistribution, "total">;
  label: string;
  color: string;
  bgColor: string;
}[] = [
  { key: "eagle", label: "Eagle-", color: "bg-green-600", bgColor: "bg-green-100" },
  { key: "birdie", label: "Birdie", color: "bg-blue-500", bgColor: "bg-blue-100" },
  { key: "par", label: "Par", color: "bg-green-500", bgColor: "bg-green-50" },
  { key: "bogey", label: "Bogey", color: "bg-orange-400", bgColor: "bg-orange-50" },
  { key: "doublePlus", label: "D.Bogey+", color: "bg-red-500", bgColor: "bg-red-50" },
];

export function ScoreDistributionChart({ scores }: ScoreDistributionChartProps) {
  const dist = calculateScoreDistribution(
    scores.map((s) => ({
      hole_number: s.hole_number,
      par: s.par,
      score: s.score,
      putts: s.putts,
      fairway_result: s.fairway_result,
      pin_position: s.pin_position,
      shots_detail: s.shots_detail,
    }))
  );

  if (dist.total === 0) return null;

  const maxCount = Math.max(...DISTRIBUTION_ITEMS.map((item) => dist[item.key]));

  return (
    <div className="space-y-2">
      {DISTRIBUTION_ITEMS.map((item) => {
        const count = dist[item.key];
        const pct = dist.total > 0 ? (count / dist.total) * 100 : 0;
        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

        return (
          <div key={item.key} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16 text-right shrink-0">
              {item.label}
            </span>
            <div className="flex-1 h-6 bg-muted/30 rounded overflow-hidden">
              {count > 0 && (
                <div
                  className={`h-full ${item.color} rounded flex items-center px-2 transition-all`}
                  style={{ width: `${barWidth}%`, minWidth: count > 0 ? "24px" : "0" }}
                >
                  <span className="text-[10px] text-white font-medium">{count}</span>
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground w-10 shrink-0">
              {pct.toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
