"use client";

import { Star } from "lucide-react";
import { RoundSummary } from "@/utils/round-stats";

interface RoundSummaryStatsProps {
  summary: RoundSummary;
  avgRating: number | null; // null = ショット詳細データなし
}

export function RoundSummaryStats({ summary, avgRating }: RoundSummaryStatsProps) {
  const overPar = summary.totalScore - summary.totalPar;
  const overParStr = overPar > 0 ? `+${overPar}` : overPar === 0 ? "E" : String(overPar);
  const overParColor =
    overPar > 0 ? "text-red-600" : overPar < 0 ? "text-blue-600" : "text-gray-500";

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {/* SCORE + ±Par 同一カード */}
      <div className="p-3 bg-muted/50 rounded-lg text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">SCORE</p>
        <p className="text-xl font-bold">{summary.totalScore}</p>
        <p className={`text-xs font-bold ${overParColor}`}>{overParStr}</p>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">PUTT</p>
        <p className="text-xl font-bold">{summary.totalPutts}</p>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">FW率</p>
        <p className="text-xl font-bold">{summary.fairwayKeepRate.toFixed(0)}%</p>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">パーオン</p>
        <p className="text-xl font-bold">{summary.girRate.toFixed(0)}%</p>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">OB</p>
        <p className="text-xl font-bold">{summary.obCount}</p>
      </div>

      {/* 平均星評価 */}
      <div className="p-3 bg-muted/50 rounded-lg text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">評価</p>
        {avgRating !== null ? (
          <div className="flex items-center justify-center gap-0.5 mt-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-xl font-bold">{avgRating.toFixed(1)}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">-</p>
        )}
      </div>
    </div>
  );
}
