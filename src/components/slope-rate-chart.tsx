"use client";

import { DistanceBucket } from "@/types/database";

interface SlopeRateChartProps {
  data: DistanceBucket[];
  title?: string;
  color?: string;
}

/** 率に応じた不透明度 */
function rateOpacity(rate: number): number {
  if (rate >= 60) return 0.8;
  if (rate >= 40) return 0.6;
  if (rate >= 20) return 0.4;
  return 0.22;
}

/**
 * 逆円錐の断面（円形）で4方向の傾斜 + 中央フラットを表示
 *
 * ゴルファー目線（ターゲット方向=上）:
 *   上: つま先上がり (ボールが足より高い=前方が高い)
 *   下: つま先下がり (ボールが足より低い=前方が低い)
 *   左: 左足上がり  (左足が高い)
 *   右: 左足下がり  (左足が低い=右足が高い)
 */
export function SlopeRateChart({ data, title, color = "#22c55e" }: SlopeRateChartProps) {
  const dataMap = new Map(data.map((d) => [d.label, d]));

  const svgW = 280;
  const svgH = 280;
  const cx = svgW / 2;
  const cy = svgH / 2;
  const outerR = 105;
  const innerR = 36;
  const halfSector = 45; // 90° / 2

  /** 4方向: 12時=左足上がり, 時計回りに90度回転済み */
  const DIRECTIONS = [
    { key: "左足上がり", angle: 0, shortLabel: "左足↑" },
    { key: "つま先上がり", angle: 90, shortLabel: "つま先↑" },
    { key: "左足下がり", angle: 180, shortLabel: "左足↓" },
    { key: "つま先下がり", angle: 270, shortLabel: "つま先↓" },
  ] as const;

  const calmData = dataMap.get("フラット");

  return (
    <div className="space-y-2">
      {title && <h4 className="text-sm font-semibold text-muted-foreground">{title}</h4>}
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH} className="max-w-full">
          {/* 4 direction sectors */}
          {DIRECTIONS.map((dir) => {
            const entry = dataMap.get(dir.key);
            const rate = entry?.rate ?? null;
            const count = entry?.count ?? 0;
            const startAngle = dir.angle - halfSector;
            const endAngle = dir.angle + halfSector;
            const fill = rate !== null ? color : "rgba(156, 163, 175, 0.15)";
            const opacity = rate !== null ? rateOpacity(rate) : 1;

            // Label position (midpoint of sector)
            const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
            const labelR = (innerR + outerR) / 2;
            const lx = cx + labelR * Math.cos(toRad(dir.angle));
            const ly = cy + labelR * Math.sin(toRad(dir.angle));

            // Direction label position (outside)
            const dirLabelR = outerR + 16;
            const dlx = cx + dirLabelR * Math.cos(toRad(dir.angle));
            const dly = cy + dirLabelR * Math.sin(toRad(dir.angle));

            return (
              <g key={dir.key}>
                <path
                  d={sectorPath(cx, cy, innerR, outerR, startAngle, endAngle)}
                  fill={fill}
                  opacity={opacity}
                  stroke="white"
                  strokeWidth={2}
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
                  {dir.shortLabel}
                </text>
                {/* Rate + count inside sector */}
                {rate !== null ? (
                  <>
                    <text
                      x={lx}
                      y={ly - 5}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={13}
                      fontWeight={700}
                      className="fill-foreground"
                    >
                      {rate.toFixed(0)}%
                    </text>
                    <text
                      x={lx}
                      y={ly + 10}
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
                    fontSize={10}
                    className="fill-muted-foreground"
                  >
                    -
                  </text>
                )}
              </g>
            );
          })}

          {/* Center circle for flat */}
          <circle
            cx={cx}
            cy={cy}
            r={innerR}
            fill={calmData ? color : "rgba(156, 163, 175, 0.1)"}
            opacity={calmData ? rateOpacity(calmData.rate) : 1}
            stroke="white"
            strokeWidth={2}
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
            フラット
          </text>
          {calmData ? (
            <>
              <text
                x={cx}
                y={cy + 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={14}
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
        </svg>
      </div>
    </div>
  );
}

/** SVGで扇形パスを生成 */
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
