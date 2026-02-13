"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Score } from "@/types/database";
import { getScoreSymbol } from "@/utils/golf-symbols";
import { calculateRoundSummary, formatRoundDate } from "@/utils/round-stats";

interface RoundCardProps {
  round: {
    id: string;
    date: string;
    tee_color: string | null;
    weather: string | null;
    out_course_name: string | null;
    in_course_name: string | null;
    courses: { name: string; pref: string | null } | null;
    scores: Score[];
  };
}

const WEATHER_ICONS: Record<string, string> = {
  晴れ: "☀",
  曇り: "☁",
  雨: "🌧",
  雪: "❄",
};

const TEE_COLORS: Record<string, string> = {
  Blue: "text-blue-600",
  White: "text-gray-600",
  Red: "text-red-600",
  Gold: "text-yellow-600",
  Black: "text-gray-900",
};

export function RoundCard({ round }: RoundCardProps) {
  const scores = round.scores;
  const summary = calculateRoundSummary(scores);
  const overPar = summary.totalScore - summary.totalPar;

  const outScores = scores
    .filter((s) => s.hole_number >= 1 && s.hole_number <= 9)
    .sort((a, b) => a.hole_number - b.hole_number);
  const inScores = scores
    .filter((s) => s.hole_number >= 10 && s.hole_number <= 18)
    .sort((a, b) => a.hole_number - b.hole_number);

  const courseName = round.courses?.name ?? "不明なコース";

  return (
    <Link href={`/my-stats/rounds/${round.id}`}>
      <div className="bg-card border rounded-xl p-4 active:scale-[0.98] transition-all cursor-pointer hover:bg-muted/30">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{formatRoundDate(round.date)}</span>
            <span className="text-sm text-muted-foreground truncate max-w-[140px]">
              {courseName}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {round.tee_color && (
              <span className={`text-xs font-medium ${TEE_COLORS[round.tee_color] ?? "text-gray-500"}`}>
                {round.tee_color}
              </span>
            )}
            {round.weather && (
              <span className="text-sm">
                {WEATHER_ICONS[round.weather] ?? round.weather}
              </span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Score</p>
            <p className="text-lg font-bold">{summary.totalScore}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Putt</p>
            <p className="text-lg font-bold">{summary.totalPutts}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">OB</p>
            <p className="text-lg font-bold">{summary.obCount}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">±Par</p>
            <p
              className={`text-lg font-bold ${
                overPar > 0 ? "text-red-600" : overPar < 0 ? "text-blue-600" : "text-gray-500"
              }`}
            >
              {overPar > 0 ? `+${overPar}` : overPar === 0 ? "E" : overPar}
            </p>
          </div>
        </div>

        {/* Score symbols row + OUT/IN scores */}
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-1 min-w-0">
            {outScores.length > 0 && (
              <div className="flex items-center gap-0.5">
                <div className="flex gap-0.5">
                  {outScores.map((s) => {
                    const sym = getScoreSymbol(s.score, s.par);
                    return (
                      <span
                        key={s.hole_number}
                        className={`w-4 h-4 rounded-sm text-[9px] font-bold flex items-center justify-center ${sym.bgColor} ${sym.color}`}
                      >
                        {sym.symbol}
                      </span>
                    );
                  })}
                </div>
                <span className="text-xs text-muted-foreground ml-1.5 whitespace-nowrap">
                  OUT {summary.outScore}
                </span>
              </div>
            )}
            {inScores.length > 0 && (
              <div className="flex items-center gap-0.5">
                <div className="flex gap-0.5">
                  {inScores.map((s) => {
                    const sym = getScoreSymbol(s.score, s.par);
                    return (
                      <span
                        key={s.hole_number}
                        className={`w-4 h-4 rounded-sm text-[9px] font-bold flex items-center justify-center ${sym.bgColor} ${sym.color}`}
                      >
                        {sym.symbol}
                      </span>
                    );
                  })}
                </div>
                <span className="text-xs text-muted-foreground ml-1.5 whitespace-nowrap">
                  IN {summary.inScore}
                </span>
              </div>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
        </div>
      </div>
    </Link>
  );
}
