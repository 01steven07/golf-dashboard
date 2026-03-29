"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Score } from "@/types/database";
import { authFetch } from "@/lib/api-client";
import { SingleRoundStats, calculateSingleRoundStats } from "@/utils/single-round-stats";

interface RoundStatsComparisonProps {
  roundId: string;
  scores: Score[];
}

interface StatsValues {
  avg_score: number;
  avg_putts: number;
  gir_rate: number;
  fairway_keep_rate: number;
  scramble_rate: number;
  birdie_count: number;
  par3_avg: number;
  par4_avg: number;
  par5_avg: number;
  bogey_avoidance: number;
  double_bogey_avoidance: number;
  putts_per_gir: number;
  three_putt_avoidance: number;
  one_putt_rate: number;
  gir_from_fairway: number;
  gir_from_rough: number;
  bounce_back_rate: number;
  ob_count: number;
}

interface ComparisonResult {
  avg: StatsValues;
  rankings: Record<string, { rank: number; total: number }>;
  member_count?: number;
  round_count?: number;
}

interface ComparisonData {
  sameDay: ComparisonResult | null;
  clubAvg: ComparisonResult | null;
  selfAvg: ComparisonResult | null;
}

type CompareMode = "sameDay" | "clubAvg" | "selfAvg";

const MODE_LABELS: { key: CompareMode; label: string; desc: string; rankLabel: string }[] = [
  { key: "sameDay", label: "同日部員", desc: "同日同コースの部員平均", rankLabel: "人中" },
  { key: "clubAvg", label: "部全体", desc: "部の直近10R平均", rankLabel: "人中" },
  { key: "selfAvg", label: "自分平均", desc: "自分の直近10R平均", rankLabel: "R中" },
];

interface StatRow {
  label: string;
  statKey: string;
  value: number;
  compareValue: number | null;
  rank: { rank: number; total: number } | null;
  format: "score" | "strokes" | "percent" | "count";
  lowerIsBetter: boolean;
}

function formatVal(v: number, format: StatRow["format"]): string {
  if (format === "percent") return `${v.toFixed(1)}%`;
  if (format === "count") return v.toFixed(1);
  if (format === "strokes") return v.toFixed(1);
  return v.toFixed(0);
}

function getDiffColor(diff: number, lowerIsBetter: boolean): string {
  const isGood = lowerIsBetter ? diff < 0 : diff > 0;
  const isBad = lowerIsBetter ? diff > 0 : diff < 0;
  if (isGood) return "text-blue-600 bg-blue-50";
  if (isBad) return "text-red-600 bg-red-50";
  return "text-gray-500 bg-gray-50";
}

function formatDiff(diff: number, format: StatRow["format"]): string {
  const sign = diff > 0 ? "+" : "";
  if (format === "percent") return `${sign}${diff.toFixed(1)}`;
  if (format === "count") return `${sign}${diff.toFixed(1)}`;
  return `${sign}${diff.toFixed(1)}`;
}

function getRankColor(rank: number, total: number): string {
  const pct = rank / total;
  if (pct <= 0.25) return "text-blue-700 bg-blue-100";
  if (pct <= 0.5) return "text-green-700 bg-green-100";
  if (pct <= 0.75) return "text-orange-700 bg-orange-100";
  return "text-red-700 bg-red-100";
}

function buildStatRows(stats: SingleRoundStats, compare: ComparisonResult | null): StatRow[] {
  const c = compare?.avg ?? null;
  const r = compare?.rankings ?? null;
  const row = (
    label: string,
    statKey: string,
    value: number,
    compareKey: keyof StatsValues,
    format: StatRow["format"],
    lowerIsBetter: boolean
  ): StatRow => ({
    label,
    statKey,
    value,
    compareValue: c ? c[compareKey] : null,
    rank: r?.[compareKey] ?? null,
    format,
    lowerIsBetter,
  });

  return [
    row("スコア", "avg_score", stats.totalScore, "avg_score", "score", true),
    row("パット", "avg_putts", stats.totalPutts, "avg_putts", "strokes", true),
    row("グリーンオン率", "gir_rate", stats.girRate, "gir_rate", "percent", false),
    row(
      "FWキープ率",
      "fairway_keep_rate",
      stats.fairwayKeepRate,
      "fairway_keep_rate",
      "percent",
      false
    ),
    row("リカバリー率", "scramble_rate", stats.scrambleRate, "scramble_rate", "percent", false),
    row("バーディー数", "birdie_count", stats.birdieCount, "birdie_count", "count", false),
    row("OB数", "ob_count", stats.obCount, "ob_count", "count", true),
    row("Par3平均", "par3_avg", stats.par3Avg, "par3_avg", "strokes", true),
    row("Par4平均", "par4_avg", stats.par4Avg, "par4_avg", "strokes", true),
    row("Par5平均", "par5_avg", stats.par5Avg, "par5_avg", "strokes", true),
    row(
      "ボギー回避率",
      "bogey_avoidance",
      stats.bogeyAvoidance,
      "bogey_avoidance",
      "percent",
      false
    ),
    row(
      "ダボ回避率",
      "double_bogey_avoidance",
      stats.doubleBogeyAvoidance,
      "double_bogey_avoidance",
      "percent",
      false
    ),
    row(
      "バウンスバック率",
      "bounce_back_rate",
      stats.bounceBackRate,
      "bounce_back_rate",
      "percent",
      false
    ),
    row(
      "グリーンオン時パット",
      "putts_per_gir",
      stats.puttsPerGir,
      "putts_per_gir",
      "strokes",
      true
    ),
    row(
      "3パット回避率",
      "three_putt_avoidance",
      stats.threePuttAvoidance,
      "three_putt_avoidance",
      "percent",
      false
    ),
    row("1パット率", "one_putt_rate", stats.onePuttRate, "one_putt_rate", "percent", false),
    row(
      "FWからグリーンオン",
      "gir_from_fairway",
      stats.girFromFairway,
      "gir_from_fairway",
      "percent",
      false
    ),
    row(
      "ラフからグリーンオン",
      "gir_from_rough",
      stats.girFromRough,
      "gir_from_rough",
      "percent",
      false
    ),
  ];
}

export function RoundStatsComparison({ roundId, scores }: RoundStatsComparisonProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<CompareMode>("clubAvg");

  const roundStats = calculateSingleRoundStats(scores);

  useEffect(() => {
    authFetch(`/api/rounds/${roundId}/comparison`)
      .then((res) => res.json())
      .then((data) => {
        setComparisonData(data);
        if (data.sameDay) setMode("sameDay");
        else if (data.clubAvg) setMode("clubAvg");
        else setMode("selfAvg");
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [roundId]);

  const currentCompare = comparisonData ? comparisonData[mode] : null;
  const currentModeLabel = MODE_LABELS.find((m) => m.key === mode);
  const statRows = buildStatRows(roundStats, currentCompare);

  // 順位が良いもの（rank/totalが小さい）から並べる。順位がない場合は末尾
  const sortedRows = [...statRows].sort((a, b) => {
    const aRatio = a.rank ? a.rank.rank / a.rank.total : 2;
    const bRatio = b.rank ? b.rank.rank / b.rank.total : 2;
    return aRatio - bRatio;
  });

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
        {MODE_LABELS.map((m) => {
          const available = comparisonData ? comparisonData[m.key] !== null : false;
          const isActive = mode === m.key;
          return (
            <button
              key={m.key}
              onClick={() => available && setMode(m.key)}
              disabled={!available && !isLoading}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all
                ${
                  isActive
                    ? "bg-white shadow-sm text-foreground"
                    : available
                      ? "text-muted-foreground hover:text-foreground"
                      : "text-muted-foreground/40 cursor-not-allowed"
                }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {currentCompare && (
            <p className="text-[10px] text-muted-foreground text-center">
              {currentModeLabel?.desc}
              {currentCompare.member_count != null && ` (${currentCompare.member_count}人)`}
              {currentCompare.round_count != null && ` ${currentCompare.round_count}R`}
            </p>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-2 pb-1 border-b">
            <span className="text-[10px] text-muted-foreground w-24 shrink-0">スタッツ</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground w-12 text-right">値</span>
              <span className="text-[10px] text-muted-foreground w-12 text-right">比較</span>
              <span className="text-[10px] text-muted-foreground w-11 text-center">差</span>
              <span className="text-[10px] text-muted-foreground w-14 text-center">順位</span>
            </div>
          </div>

          <div className="space-y-0.5">
            {sortedRows.map((row) => {
              const hasDiff = row.compareValue !== null;
              const diff = hasDiff ? row.value - row.compareValue! : 0;
              const diffColor = hasDiff ? getDiffColor(diff, row.lowerIsBetter) : "";

              return (
                <div
                  key={row.statKey}
                  className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30"
                >
                  <span className="text-xs text-muted-foreground w-24 shrink-0">{row.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold w-12 text-right">
                      {formatVal(row.value, row.format)}
                    </span>
                    {hasDiff ? (
                      <>
                        <span className="text-[10px] text-muted-foreground w-12 text-right">
                          {formatVal(row.compareValue!, row.format)}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-1 py-0.5 rounded w-11 text-center ${diffColor}`}
                        >
                          {formatDiff(diff, row.format)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-12" />
                        <span className="w-11" />
                      </>
                    )}
                    {row.rank ? (
                      <span
                        className={`text-[10px] font-bold px-1 py-0.5 rounded w-14 text-center ${getRankColor(row.rank.rank, row.rank.total)}`}
                      >
                        {row.rank.rank}/{row.rank.total}
                        {currentModeLabel?.rankLabel === "人中" ? "人" : "R"}
                      </span>
                    ) : (
                      <span className="w-14 text-center text-[10px] text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
