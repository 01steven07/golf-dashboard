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
    ext_course_labels?: string[];
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

function ScoreSymbolRow({ scores, label, total }: { scores: Score[]; label: string; total: number }) {
  if (scores.length === 0) return null;
  return (
    <div className="flex items-center gap-0.5">
      <div className="flex gap-0.5">
        {scores.map((s) => {
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
        {label} {total}
      </span>
    </div>
  );
}

export function RoundCard({ round }: RoundCardProps) {
  const scores = round.scores;
  const summary = calculateRoundSummary(scores);
  const overPar = summary.totalScore - summary.totalPar;
  const holeCount = scores.length;

  // Split scores into 9-hole groups
  const outScores = scores
    .filter((s) => s.hole_number >= 1 && s.hole_number <= 9)
    .sort((a, b) => a.hole_number - b.hole_number);
  const inScores = scores
    .filter((s) => s.hole_number >= 10 && s.hole_number <= 18)
    .sort((a, b) => a.hole_number - b.hole_number);
  const ext1Scores = scores
    .filter((s) => s.hole_number >= 19 && s.hole_number <= 27)
    .sort((a, b) => a.hole_number - b.hole_number);
  const ext2Scores = scores
    .filter((s) => s.hole_number >= 28 && s.hole_number <= 36)
    .sort((a, b) => a.hole_number - b.hole_number);

  const courseName = round.courses?.name ?? "不明なコース";
  const extLabels = round.ext_course_labels ?? [];

  // Build labels for each 9-hole group
  const outLabel = round.out_course_name || "OUT";
  const inLabel = round.in_course_name || "IN";
  const ext1Label = extLabels[0] || "EXT1";
  const ext2Label = extLabels[1] || "EXT2";

  const outTotal = outScores.reduce((sum, s) => sum + s.score, 0);
  const inTotal = inScores.reduce((sum, s) => sum + s.score, 0);
  const ext1Total = ext1Scores.reduce((sum, s) => sum + s.score, 0);
  const ext2Total = ext2Scores.reduce((sum, s) => sum + s.score, 0);

  // Course names display
  const courseNames = [round.out_course_name, round.in_course_name, ...extLabels].filter(Boolean);

  return (
    <Link href={`/my-stats/rounds/${round.id}`}>
      <div className="bg-card border rounded-xl p-4 active:scale-[0.98] transition-all cursor-pointer hover:bg-muted/30">
        {/* Header row */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium shrink-0">{formatRoundDate(round.date)}</span>
            <span className="text-sm text-muted-foreground truncate">
              {courseName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {holeCount !== 18 && (
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                {holeCount}H
              </span>
            )}
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

        {/* Course names sub-header */}
        {courseNames.length > 0 && (
          <p className="text-[10px] text-muted-foreground mb-2 truncate">
            {courseNames.join(" / ")}
          </p>
        )}

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

        {/* Score symbols rows */}
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-1 min-w-0">
            <ScoreSymbolRow scores={outScores} label={outLabel} total={outTotal} />
            <ScoreSymbolRow scores={inScores} label={inLabel} total={inTotal} />
            <ScoreSymbolRow scores={ext1Scores} label={ext1Label} total={ext1Total} />
            <ScoreSymbolRow scores={ext2Scores} label={ext2Label} total={ext2Total} />
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
        </div>
      </div>
    </Link>
  );
}
