"use client";

import { RoundSummary } from "@/utils/round-stats";

interface RoundSummaryStatsProps {
  summary: RoundSummary;
}

export function RoundSummaryStats({ summary }: RoundSummaryStatsProps) {
  const overPar = summary.totalScore - summary.totalPar;

  const stats = [
    {
      label: "SCORE",
      value: String(summary.totalScore),
    },
    {
      label: "±Par",
      value: overPar > 0 ? `+${overPar}` : overPar === 0 ? "E" : String(overPar),
      color: overPar > 0 ? "text-red-600" : overPar < 0 ? "text-blue-600" : "text-gray-500",
    },
    {
      label: "PUTT",
      value: String(summary.totalPutts),
    },
    {
      label: "FW率",
      value: `${summary.fairwayKeepRate.toFixed(0)}%`,
    },
    {
      label: "GIR",
      value: `${summary.girRate.toFixed(0)}%`,
    },
    {
      label: "OB",
      value: String(summary.obCount),
    },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {stat.label}
          </p>
          <p className={`text-xl font-bold ${stat.color ?? ""}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
