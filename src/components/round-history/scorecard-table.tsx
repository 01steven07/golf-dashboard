"use client";

import { Score, FairwayResult } from "@/types/database";
import { getScoreSymbol, getFairwaySymbol } from "@/utils/golf-symbols";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface ScorecardTableProps {
  scores: Score[];
  /** @deprecated Use sectionLabels instead */
  extCourseLabels?: string[];
  /** 解決済みセクションラベル（新カラム優先で親が解決） */
  sectionLabels?: string[];
}

function HalfTable({
  label,
  holeScores,
  startHole,
}: {
  label: string;
  holeScores: Score[];
  startHole: number;
}) {
  if (holeScores.length === 0) return null;

  const sorted = [...holeScores].sort((a, b) => a.hole_number - b.hole_number);
  const totalPar = sorted.reduce((sum, s) => sum + s.par, 0);
  const totalScore = sorted.reduce((sum, s) => sum + s.score, 0);
  const totalPutts = sorted.reduce((sum, s) => sum + s.putts, 0);

  const stickyClass = "sticky left-0 z-10 bg-card";

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <Table className="text-xs min-w-[400px]">
        <TableHeader>
          <TableRow>
            <TableHead className={`w-12 ${stickyClass} bg-muted/50`}>{label}</TableHead>
            {sorted.map((s) => (
              <TableHead key={s.hole_number} className="text-center w-8 px-1">
                {s.hole_number - startHole + 1}
              </TableHead>
            ))}
            <TableHead className="text-center w-10 px-1 font-bold">計</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Par row */}
          <TableRow>
            <TableCell className={`font-medium ${stickyClass}`}>Par</TableCell>
            {sorted.map((s) => (
              <TableCell key={s.hole_number} className="text-center px-1">
                {s.par}
              </TableCell>
            ))}
            <TableCell className="text-center px-1 font-bold">{totalPar}</TableCell>
          </TableRow>

          {/* Score row - symbols */}
          <TableRow>
            <TableCell className={`font-medium ${stickyClass}`}>Score</TableCell>
            {sorted.map((s) => {
              const sym = getScoreSymbol(s.score, s.par);
              return (
                <TableCell
                  key={s.hole_number}
                  className={`text-center px-1 font-bold ${sym.bgColor} ${sym.color}`}
                >
                  {sym.symbol}
                </TableCell>
              );
            })}
            {(() => {
              const overPar = totalScore - totalPar;
              const overParStr =
                overPar > 0 ? `+${overPar}` : overPar === 0 ? "E" : String(overPar);
              const overParColor =
                overPar > 0 ? "text-red-600" : overPar < 0 ? "text-blue-600" : "text-gray-500";
              return (
                <TableCell className="text-center px-1 font-bold">
                  <div>{totalScore}</div>
                  <div className={`text-[10px] ${overParColor}`}>{overParStr}</div>
                </TableCell>
              );
            })()}
          </TableRow>

          {/* Putt row */}
          <TableRow>
            <TableCell className={`font-medium ${stickyClass}`}>Putt</TableCell>
            {sorted.map((s) => (
              <TableCell key={s.hole_number} className="text-center px-1">
                {s.putts}
              </TableCell>
            ))}
            <TableCell className="text-center px-1 font-bold">{totalPutts}</TableCell>
          </TableRow>

          {/* Fairway row */}
          <TableRow>
            <TableCell className={`font-medium ${stickyClass}`}>FW</TableCell>
            {sorted.map((s) => {
              if (s.par <= 3) {
                return (
                  <TableCell key={s.hole_number} className="text-center px-1 text-gray-300">
                    -
                  </TableCell>
                );
              }
              const fw = getFairwaySymbol(s.fairway_result as FairwayResult);
              return (
                <TableCell key={s.hole_number} className={`text-center px-1 ${fw.color}`}>
                  {fw.symbol}
                </TableCell>
              );
            })}
            <TableCell className="text-center px-1" />
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

/** セクションラベルを生成: OUT, IN, ext_course_labels[0], ext_course_labels[1] */
export function getSectionLabels(extCourseLabels: string[] = []): string[] {
  return ["OUT", "IN", ...extCourseLabels];
}

export function ScorecardTable({
  scores,
  extCourseLabels = [],
  sectionLabels,
}: ScorecardTableProps) {
  const sorted = [...scores].sort((a, b) => a.hole_number - b.hole_number);
  const labels = sectionLabels ?? getSectionLabels(extCourseLabels);

  // 9ホールごとにセクション分割（最大4セクション = 36H）
  const sections: { label: string; holes: Score[]; startHole: number }[] = [];
  for (let i = 0; i < 4; i++) {
    const min = i * 9 + 1;
    const max = i * 9 + 9;
    const chunk = sorted.filter((s) => s.hole_number >= min && s.hole_number <= max);
    if (chunk.length === 0) break;
    sections.push({ label: labels[i] ?? `H${min}-${max}`, holes: chunk, startHole: min });
  }

  const totalPar = scores.reduce((sum, s) => sum + s.par, 0);
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const totalPutts = scores.reduce((sum, s) => sum + s.putts, 0);

  return (
    <div className="space-y-4">
      {sections.map((sec) => (
        <HalfTable
          key={sec.startHole}
          label={sec.label}
          holeScores={sec.holes}
          startHole={sec.startHole}
        />
      ))}

      {sections.length >= 2 &&
        (() => {
          const overPar = totalScore - totalPar;
          const overParStr = overPar > 0 ? `+${overPar}` : overPar === 0 ? "E" : String(overPar);
          const overParColor =
            overPar > 0 ? "text-red-600" : overPar < 0 ? "text-blue-600" : "text-gray-500";
          return (
            <div className="grid grid-cols-3 gap-3 pt-2 border-t">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Score</p>
                <p className="text-lg font-bold">{totalScore}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">±Par</p>
                <p className={`text-lg font-bold ${overParColor}`}>{overParStr}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Putt</p>
                <p className="text-lg font-bold">{totalPutts}</p>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
