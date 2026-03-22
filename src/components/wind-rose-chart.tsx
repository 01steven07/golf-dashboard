"use client";

import { DistanceBucket } from "@/types/database";

interface WindRoseChartProps {
  data: DistanceBucket[];
  title?: string;
}

/**
 * 8方向の定義（ゴルファー目線: ターゲット方向=上）
 * 12時=向かい風（ターゲット方向から吹いてくる）から時計回り
 */
const DIRECTIONS = [
  { key: "向かい風", angle: 0 },
  { key: "右向かい風", angle: 45 },
  { key: "右風", angle: 90 },
  { key: "右追い風", angle: 135 },
  { key: "追い風", angle: 180 },
  { key: "左追い風", angle: 225 },
  { key: "左風", angle: 270 },
  { key: "左向かい風", angle: 315 },
] as const;

/** GIR率に応じた色の濃さを返す */
function getRateColor(rate: number): string {
  if (rate >= 60) return "rgba(34, 197, 94, 0.8)";
  if (rate >= 40) return "rgba(34, 197, 94, 0.55)";
  if (rate >= 20) return "rgba(34, 197, 94, 0.35)";
  return "rgba(34, 197, 94, 0.18)";
}

/** SVGでコンパスローズの1セグメント（扇形）のパスを生成 */
function sectorPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const s1 = toRad(startAngleDeg);
  const e1 = toRad(endAngleDeg);

  const x1 = cx + outerR * Math.cos(s1);
  const y1 = cy + outerR * Math.sin(s1);
  const x2 = cx + outerR * Math.cos(e1);
  const y2 = cy + outerR * Math.sin(e1);
  const x3 = cx + innerR * Math.cos(e1);
  const y3 = cy + innerR * Math.sin(e1);
  const x4 = cx + innerR * Math.cos(s1);
  const y4 = cy + innerR * Math.sin(s1);

  return [
    `M ${x1} ${y1}`,
    `A ${outerR} ${outerR} 0 0 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${innerR} ${innerR} 0 0 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}

/** 風向き矢印SVG（外縁→中心方向の小矢印） */
function windArrow(cx: number, cy: number, angleDeg: number, r: number, len: number): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const rad = toRad(angleDeg);
  // arrow starts at outer edge, points inward
  const sx = cx + r * Math.cos(rad);
  const sy = cy + r * Math.sin(rad);
  const ex = cx + (r - len) * Math.cos(rad);
  const ey = cy + (r - len) * Math.sin(rad);
  // arrowhead wings
  const wingLen = 3;
  const wingAngle = 0.5;
  const wx1 = ex - wingLen * Math.cos(rad - wingAngle);
  const wy1 = ey - wingLen * Math.sin(rad - wingAngle);
  const wx2 = ex - wingLen * Math.cos(rad + wingAngle);
  const wy2 = ey - wingLen * Math.sin(rad + wingAngle);

  return `M ${sx} ${sy} L ${ex} ${ey} M ${wx1} ${wy1} L ${ex} ${ey} L ${wx2} ${wy2}`;
}

export function WindRoseChart({ data, title }: WindRoseChartProps) {
  const cx = 150;
  const cy = 150;
  const outerR = 110;
  const innerR = 38;
  const halfSector = 22.5;

  const dataMap = new Map(data.map((d) => [d.label, d]));
  const calmData = dataMap.get("無風");

  return (
    <div className="space-y-2">
      {title && <h4 className="text-sm font-semibold text-muted-foreground">{title}</h4>}
      <div className="flex justify-center">
        <svg viewBox="0 0 300 310" width="300" height="310" className="max-w-full">
          {/* Target direction indicator */}
          <text
            x={cx}
            y={6}
            textAnchor="middle"
            fontSize={8}
            className="fill-muted-foreground"
            opacity={0.6}
          >
            ターゲット方向
          </text>
          <polygon
            points={`${cx},10 ${cx - 3},16 ${cx + 3},16`}
            className="fill-muted-foreground"
            opacity={0.4}
          />

          {/* Golfer indicator at bottom */}
          <text
            x={cx}
            y={306}
            textAnchor="middle"
            fontSize={8}
            className="fill-muted-foreground"
            opacity={0.6}
          >
            自分
          </text>

          {/* Move chart down slightly for top label */}
          <g transform={`translate(0, 10)`}>
            {/* 8 direction sectors */}
            {DIRECTIONS.map((dir) => {
              const entry = dataMap.get(dir.key);
              const rate = entry?.rate ?? null;
              const count = entry?.count ?? 0;
              const startAngle = dir.angle - halfSector;
              const endAngle = dir.angle + halfSector;
              const fill = rate !== null ? getRateColor(rate) : "rgba(156, 163, 175, 0.15)";

              const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
              const labelR = (innerR + outerR) / 2;
              const lx = cx + labelR * Math.cos(toRad(dir.angle));
              const ly = cy + labelR * Math.sin(toRad(dir.angle));

              const dirLabelR = outerR + 18;
              const dlx = cx + dirLabelR * Math.cos(toRad(dir.angle));
              const dly = cy + dirLabelR * Math.sin(toRad(dir.angle));

              return (
                <g key={dir.key}>
                  <path
                    d={sectorPath(cx, cy, innerR, outerR, startAngle, endAngle)}
                    fill={fill}
                    stroke="white"
                    strokeWidth={1.5}
                  />
                  {/* Wind direction arrow (outer edge → center) */}
                  <path
                    d={windArrow(cx, cy, dir.angle, outerR - 2, 12)}
                    fill="none"
                    stroke="rgba(100, 116, 139, 0.5)"
                    strokeWidth={1.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Direction label */}
                  <text
                    x={dlx}
                    y={dly}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-muted-foreground"
                    fontSize={9}
                    fontWeight={500}
                  >
                    {dir.key}
                  </text>
                  {/* Rate + count inside sector */}
                  {rate !== null ? (
                    <>
                      <text
                        x={lx}
                        y={ly - 5}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={11}
                        fontWeight={700}
                        className="fill-foreground"
                      >
                        {rate.toFixed(0)}%
                      </text>
                      <text
                        x={lx}
                        y={ly + 8}
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
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={9}
                      className="fill-muted-foreground"
                    >
                      -
                    </text>
                  )}
                </g>
              );
            })}

            {/* Center circle for calm/no wind */}
            <circle
              cx={cx}
              cy={cy}
              r={innerR}
              fill={calmData ? getRateColor(calmData.rate) : "rgba(156, 163, 175, 0.1)"}
              stroke="white"
              strokeWidth={1.5}
            />
            <text
              x={cx}
              y={cy - 12}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={9}
              className="fill-muted-foreground"
              fontWeight={500}
            >
              無風
            </text>
            {calmData ? (
              <>
                <text
                  x={cx}
                  y={cy + 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={13}
                  fontWeight={700}
                  className="fill-foreground"
                >
                  {calmData.rate.toFixed(0)}%
                </text>
                <text
                  x={cx}
                  y={cy + 16}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={8}
                  className="fill-muted-foreground"
                >
                  n={calmData.count}
                </text>
              </>
            ) : (
              <text
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                className="fill-muted-foreground"
              >
                -
              </text>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}
