"use client";

import { PuttCrossCell, DistanceBucket } from "@/types/database";

interface PuttHeatmapProps {
  crossData: PuttCrossCell[];
  slopeData: DistanceBucket[];
  breakData: DistanceBucket[];
  title?: string;
}

const SLOPES = ["上り", "フラット", "下り"] as const;
const BREAKS = ["フック", "ストレート", "スライス"] as const;

const color = "#8b5cf6";

/** 率に応じた色を返す */
function cellColor(rate: number): string {
  if (rate >= 70) return `rgba(139, 92, 246, 0.85)`;
  if (rate >= 50) return `rgba(139, 92, 246, 0.6)`;
  if (rate >= 30) return `rgba(139, 92, 246, 0.4)`;
  if (rate >= 10) return `rgba(139, 92, 246, 0.22)`;
  return `rgba(139, 92, 246, 0.1)`;
}

export function PuttHeatmap({ crossData, slopeData, breakData, title }: PuttHeatmapProps) {
  const crossMap = new Map(
    crossData.map((d) => [`${d.slope}:${d.break_dir}`, d])
  );
  const slopeMap = new Map(slopeData.map((d) => [d.label, d]));
  const breakMap = new Map(breakData.map((d) => [d.label, d]));

  const svgW = 300;
  const svgH = 260;

  // Grid layout
  const gridX = 72;
  const gridY = 30;
  const cellW = 64;
  const cellH = 50;
  const gap = 3;

  // Column header area
  const headerY = gridY - 18;
  // Row header area
  const rowLabelX = gridX - 8;

  // Summary row/col
  const summaryGap = 10;

  return (
    <div className="space-y-2">
      {title && (
        <h4 className="text-sm font-semibold text-muted-foreground">{title}</h4>
      )}
      <div className="flex justify-center">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width={svgW}
          height={svgH}
          className="max-w-full"
        >
          {/* Column headers (break) */}
          {BREAKS.map((brk, ci) => {
            const x = gridX + ci * (cellW + gap) + cellW / 2;
            return (
              <text
                key={`col-${brk}`}
                x={x}
                y={headerY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fontWeight={500}
                className="fill-muted-foreground"
              >
                {brk}
              </text>
            );
          })}

          {/* 3×3 grid */}
          {SLOPES.map((slope, ri) => {
            const y = gridY + ri * (cellH + gap);

            return (
              <g key={slope}>
                {/* Row label */}
                <text
                  x={rowLabelX}
                  y={y + cellH / 2}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontSize={10}
                  fontWeight={500}
                  className="fill-muted-foreground"
                >
                  {slope}
                </text>

                {/* Cells */}
                {BREAKS.map((brk, ci) => {
                  const x = gridX + ci * (cellW + gap);
                  const entry = crossMap.get(`${slope}:${brk}`);
                  const rate = entry?.rate ?? null;
                  const count = entry?.count ?? 0;

                  return (
                    <g key={`${slope}-${brk}`}>
                      <rect
                        x={x}
                        y={y}
                        width={cellW}
                        height={cellH}
                        rx={6}
                        fill={rate !== null ? cellColor(rate) : "rgba(156, 163, 175, 0.1)"}
                      />
                      {rate !== null ? (
                        <>
                          <text
                            x={x + cellW / 2}
                            y={y + cellH / 2 - 5}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={15}
                            fontWeight={700}
                            fill={rate >= 50 ? "white" : "currentColor"}
                            className={rate >= 50 ? "" : "fill-foreground"}
                          >
                            {rate.toFixed(0)}%
                          </text>
                          <text
                            x={x + cellW / 2}
                            y={y + cellH / 2 + 11}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={8}
                            fill={rate >= 50 ? "rgba(255,255,255,0.7)" : "currentColor"}
                            className={rate >= 50 ? "" : "fill-muted-foreground"}
                          >
                            n={count}
                          </text>
                        </>
                      ) : (
                        <text
                          x={x + cellW / 2}
                          y={y + cellH / 2}
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

                {/* Row summary (slope total) */}
                {(() => {
                  const entry = slopeMap.get(slope);
                  const rX = gridX + 3 * (cellW + gap) + summaryGap;
                  return entry ? (
                    <text
                      x={rX}
                      y={y + cellH / 2}
                      dominantBaseline="central"
                      fontSize={11}
                      fontWeight={600}
                      className="fill-foreground"
                    >
                      {entry.rate.toFixed(0)}%
                    </text>
                  ) : null;
                })()}
              </g>
            );
          })}

          {/* Column summaries (break totals) */}
          {BREAKS.map((brk, ci) => {
            const entry = breakMap.get(brk);
            const x = gridX + ci * (cellW + gap) + cellW / 2;
            const y = gridY + 3 * (cellH + gap) + summaryGap - 2;
            return entry ? (
              <text
                key={`sum-${brk}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11}
                fontWeight={600}
                className="fill-foreground"
              >
                {entry.rate.toFixed(0)}%
              </text>
            ) : null;
          })}

          {/* Legend */}
          <g transform={`translate(${gridX}, ${svgH - 22})`}>
            {[10, 30, 50, 70].map((v, i) => (
              <g key={v} transform={`translate(${i * 52}, 0)`}>
                <rect
                  x={0}
                  y={0}
                  width={14}
                  height={10}
                  rx={2}
                  fill={cellColor(v)}
                />
                <text
                  x={18}
                  y={5}
                  dominantBaseline="central"
                  fontSize={8}
                  className="fill-muted-foreground"
                >
                  {v}%{v === 70 ? "+" : "~"}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
