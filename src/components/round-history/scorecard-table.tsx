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

          {/* Score row */}
          <TableRow>
            <TableCell className={`font-medium ${stickyClass}`}>Score</TableCell>
            {sorted.map((s) => {
              const sym = getScoreSymbol(s.score, s.par);
              return (
                <TableCell
                  key={s.hole_number}
                  className={`text-center px-1 font-bold ${sym.bgColor} ${sym.color}`}
                >
                  {s.score}
                </TableCell>
              );
            })}
            <TableCell className="text-center px-1 font-bold">{totalScore}</TableCell>
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

export function ScorecardTable({ scores }: ScorecardTableProps) {
  const outScores = scores.filter((s) => s.hole_number >= 1 && s.hole_number <= 9);
  const inScores = scores.filter((s) => s.hole_number >= 10 && s.hole_number <= 18);

  const totalPar = scores.reduce((sum, s) => sum + s.par, 0);
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const totalPutts = scores.reduce((sum, s) => sum + s.putts, 0);

  return (
    <div className="space-y-4">
      <HalfTable label="OUT" holeScores={outScores} startHole={1} />
      <HalfTable label="IN" holeScores={inScores} startHole={10} />

      {outScores.length > 0 && inScores.length > 0 && (
        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Total Par</p>
            <p className="text-sm font-bold">{totalPar}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Total Score</p>
            <p className="text-lg font-bold">{totalScore}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Total Putt</p>
            <p className="text-sm font-bold">{totalPutts}</p>
          </div>
        </div>
      )}
    </div>
  );
}
