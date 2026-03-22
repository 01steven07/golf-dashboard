"use client";

import { Score } from "@/types/database";
import { calculateScoreDistribution, ScoreDistribution } from "@/utils/course-stats";
import { SCORE_COLORS } from "@/utils/score-colors";

interface ScoreDistributionChartProps {
  scores: Score[];
}

const DISTRIBUTION_ITEMS: {
  key: keyof Omit<ScoreDistribution, "total">;
  label: string;
  color: string;
}[] = [
  { key: "eagle", label: "Eagle-", color: SCORE_COLORS.eagle },
  { key: "birdie", label: "Birdie", color: SCORE_COLORS.birdie },
  { key: "par", label: "Par", color: SCORE_COLORS.par },
  { key: "bogey", label: "Bogey", color: SCORE_COLORS.bogey },
  { key: "doublePlus", label: "D.Bogey+", color: SCORE_COLORS.doublePlus },
];

/** SVGベースの円グラフ（ResponsiveContainer不要） */
function PieChartSVG({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 54;
  const innerR = 26;

  let cumAngle = -Math.PI / 2;
  const slices: { path: string; color: string }[] = [];

  for (const d of data) {
    const angle = (d.value / total) * 2 * Math.PI;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle;

    const largeArc = angle > Math.PI ? 1 : 0;
    const x1o = cx + outerR * Math.cos(startAngle);
    const y1o = cy + outerR * Math.sin(startAngle);
    const x2o = cx + outerR * Math.cos(endAngle);
    const y2o = cy + outerR * Math.sin(endAngle);
    const x1i = cx + innerR * Math.cos(endAngle);
    const y1i = cy + innerR * Math.sin(endAngle);
    const x2i = cx + innerR * Math.cos(startAngle);
    const y2i = cy + innerR * Math.sin(startAngle);

    const path = [
      `M ${x1o} ${y1o}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
      `L ${x1i} ${y1i}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i}`,
      `Z`,
    ].join(" ");

    slices.push({ path, color: d.color });
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((slice, i) => (
        <path key={i} d={slice.path} fill={slice.color} />
      ))}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-sm font-bold"
      >
        {total}H
      </text>
    </svg>
  );
}

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

  const data = DISTRIBUTION_ITEMS.filter((item) => dist[item.key] > 0).map((item) => ({
    name: item.label,
    value: dist[item.key],
    color: item.color,
    pct: ((dist[item.key] / dist.total) * 100).toFixed(0),
  }));

  return (
    <div className="flex items-center gap-4">
      <div className="shrink-0">
        <PieChartSVG data={data} />
      </div>
      <div className="flex-1 space-y-1.5">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-muted-foreground w-16">{item.name}</span>
            <span className="text-xs font-bold">{item.value}</span>
            <span className="text-[10px] text-muted-foreground">({item.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
