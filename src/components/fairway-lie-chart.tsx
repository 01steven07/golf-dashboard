"use client";

import { DistanceBucket } from "@/types/database";

interface FairwayLieChartProps {
  data: DistanceBucket[];
  title?: string;
}

/** ゾーン定義（左→右の断面図） */
const ZONES = [
  { label: "左バンカー", baseColor: "#d4a574", width: 0.14 },
  { label: "左ラフ", baseColor: "#6b8e23", width: 0.18 },
  { label: "フェアウェイ", baseColor: "#22c55e", width: 0.36 },
  { label: "右ラフ", baseColor: "#6b8e23", width: 0.18 },
  { label: "右バンカー", baseColor: "#d4a574", width: 0.14 },
] as const;

/** GIR率に応じた不透明度 */
function rateOpacity(rate: number): number {
  if (rate >= 60) return 0.9;
  if (rate >= 40) return 0.7;
  if (rate >= 20) return 0.5;
  return 0.35;
}

export function FairwayLieChart({ data, title }: FairwayLieChartProps) {
  const dataMap = new Map(data.map((d) => [d.label, d]));

  const svgW = 300;
  const svgH = 160;
  const topPad = 2;
  const zoneH = 100;
  const bottomPad = svgH - topPad - zoneH;

  let xCursor = 0;

  return (
    <div className="space-y-2">
      {title && <h4 className="text-sm font-semibold text-muted-foreground">{title}</h4>}
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH} className="max-w-full">
          {ZONES.map((zone) => {
            const w = zone.width * svgW;
            const x = xCursor;
            xCursor += w;

            const entry = dataMap.get(zone.label);
            const rate = entry?.rate ?? null;
            const count = entry?.count ?? 0;
            const opacity = rate !== null ? rateOpacity(rate) : 0.2;

            const cx = x + w / 2;

            return (
              <g key={zone.label}>
                {/* Zone rectangle */}
                <rect
                  x={x}
                  y={topPad}
                  width={w}
                  height={zoneH}
                  fill={zone.baseColor}
                  opacity={opacity}
                  rx={zone.label === "フェアウェイ" ? 0 : 4}
                />
                {/* Separator line */}
                <line
                  x1={x}
                  y1={topPad}
                  x2={x}
                  y2={topPad + zoneH}
                  stroke="white"
                  strokeWidth={1.5}
                />

                {/* Rate inside zone */}
                {rate !== null ? (
                  <>
                    <text
                      x={cx}
                      y={topPad + zoneH / 2 - 6}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={zone.label === "フェアウェイ" ? 16 : 13}
                      fontWeight={700}
                      className="fill-foreground"
                    >
                      {rate.toFixed(0)}%
                    </text>
                    <text
                      x={cx}
                      y={topPad + zoneH / 2 + 12}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={8}
                      className="fill-muted-foreground"
                    >
                      n={count}
                    </text>
                  </>
                ) : (
                  <text
                    x={cx}
                    y={topPad + zoneH / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={10}
                    className="fill-muted-foreground"
                  >
                    -
                  </text>
                )}

                {/* Label below */}
                <text
                  x={cx}
                  y={topPad + zoneH + bottomPad / 2 + 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  fontWeight={500}
                  className="fill-muted-foreground"
                >
                  {zone.label}
                </text>
              </g>
            );
          })}

          {/* Right edge line */}
          <line
            x1={svgW}
            y1={topPad}
            x2={svgW}
            y2={topPad + zoneH}
            stroke="white"
            strokeWidth={1.5}
          />
        </svg>
      </div>
    </div>
  );
}
