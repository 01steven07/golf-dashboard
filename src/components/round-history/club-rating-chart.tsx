"use client";

import { Score } from "@/types/database";
import { parseShots } from "@/utils/course-stats";
import { Club } from "@/types/shot";

interface ClubRatingChartProps {
  scores: Score[];
}

interface CategoryRating {
  category: string;
  avgRating: number;
  count: number;
  color: string;
}

const CLUB_CATEGORIES: { category: string; clubs: Club[]; color: string }[] = [
  { category: "ドライバー", clubs: ["1W"], color: "#f87171" }, // red-400
  { category: "ウッド", clubs: ["3W", "5W", "7W"], color: "#fb923c" }, // orange-400
  { category: "UT", clubs: ["UT2", "UT3", "UT4", "UT5", "UT6", "UT7"], color: "#fbbf24" }, // amber-400
  {
    category: "アイアン",
    clubs: ["2I", "3I", "4I", "5I", "6I", "7I", "8I", "9I", "PW"],
    color: "#34d399",
  }, // emerald-400
  {
    category: "ウェッジ",
    clubs: ["46", "48", "50", "52", "54", "56", "58", "60"],
    color: "#38bdf8",
  }, // sky-400
  { category: "パター", clubs: ["PT"], color: "#c084fc" }, // purple-400
];

function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return "最高";
  if (rating >= 3.5) return "良好";
  if (rating >= 2.5) return "普通";
  if (rating >= 1.5) return "不調";
  return "最悪";
}

function getRatingBgColor(rating: number): string {
  if (rating >= 4.0) return "bg-green-50 border-green-200";
  if (rating >= 3.0) return "bg-blue-50 border-blue-200";
  if (rating >= 2.0) return "bg-orange-50 border-orange-200";
  return "bg-red-50 border-red-200";
}

/** SVGベースの横棒グラフ */
function RatingBarChart({ data }: { data: CategoryRating[] }) {
  const barHeight = 22;
  const gap = 8;
  const labelWidth = 64;
  const valueWidth = 40;
  const chartWidth = 200;
  const totalWidth = labelWidth + chartWidth + valueWidth + 12;
  const totalHeight = data.length * (barHeight + gap) - gap + 4;

  return (
    <svg
      width="100%"
      height={totalHeight}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      preserveAspectRatio="xMinYMin meet"
    >
      {/* Grid lines at 1,2,3,4,5 */}
      {[1, 2, 3, 4, 5].map((v) => {
        const x = labelWidth + (v / 5) * chartWidth;
        return (
          <line
            key={v}
            x1={x}
            y1={0}
            x2={x}
            y2={totalHeight}
            stroke="#e5e7eb"
            strokeWidth={0.5}
            strokeDasharray={v < 5 ? "2,2" : undefined}
          />
        );
      })}
      {/* Baseline */}
      <line
        x1={labelWidth}
        y1={0}
        x2={labelWidth}
        y2={totalHeight}
        stroke="#d1d5db"
        strokeWidth={0.5}
      />

      {data.map((d, i) => {
        const y = i * (barHeight + gap);
        const barW = (d.avgRating / 5) * chartWidth;
        return (
          <g key={d.category}>
            {/* Label */}
            <text
              x={labelWidth - 4}
              y={y + barHeight / 2}
              textAnchor="end"
              dominantBaseline="central"
              className="fill-muted-foreground"
              fontSize={11}
            >
              {d.category}
            </text>
            {/* Bar */}
            <rect
              x={labelWidth}
              y={y + 2}
              width={barW}
              height={barHeight - 4}
              rx={3}
              fill={d.color}
              opacity={0.85}
            />
            {/* Value */}
            <text
              x={labelWidth + chartWidth + 4}
              y={y + barHeight / 2}
              textAnchor="start"
              dominantBaseline="central"
              className="fill-foreground"
              fontSize={12}
              fontWeight="bold"
            >
              {d.avgRating.toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function ClubRatingChart({ scores }: ClubRatingChartProps) {
  const categoryRatings: CategoryRating[] = [];

  for (const cat of CLUB_CATEGORIES) {
    let totalRating = 0;
    let count = 0;

    for (const score of scores) {
      const shots = parseShots(score.shots_detail);
      for (const shot of shots) {
        if (shot.type === "putt") {
          if (cat.clubs.includes("PT" as Club)) {
            totalRating += shot.rating;
            count++;
          }
        } else {
          if (cat.clubs.includes(shot.club)) {
            totalRating += shot.rating;
            count++;
          }
        }
      }
    }

    if (count > 0) {
      categoryRatings.push({
        category: cat.category,
        avgRating: totalRating / count,
        count,
        color: cat.color,
      });
    }
  }

  if (categoryRatings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        ショット詳細データがありません
      </p>
    );
  }

  // Overall average
  const overallAvg =
    categoryRatings.reduce((s, c) => s + c.avgRating * c.count, 0) /
    categoryRatings.reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-3">
      {/* Overall badge */}
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-lg border ${getRatingBgColor(overallAvg)}`}
      >
        <span className="text-xs font-medium">総合評価</span>
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold">{overallAvg.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">/ 5.0</span>
          <span className="text-[10px] text-muted-foreground ml-1">
            ({getRatingLabel(overallAvg)})
          </span>
        </div>
      </div>

      {/* Bar chart */}
      <RatingBarChart data={categoryRatings} />

      {/* Shot counts */}
      <div className="flex flex-wrap gap-2">
        {categoryRatings.map((cr) => (
          <span key={cr.category} className="text-[10px] text-muted-foreground">
            {cr.category}: {cr.count}打
          </span>
        ))}
      </div>
    </div>
  );
}
