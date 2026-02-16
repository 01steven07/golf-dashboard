"use client";

import { Score, FairwayResult } from "@/types/database";
import { getScoreSymbol, getFairwaySymbol } from "@/utils/golf-symbols";
import { ScoreDisplay } from "@/components/shot-input/score-display";
import { ShotDetailView } from "@/components/round-history/shot-detail-view";
import { Card, CardContent } from "@/components/ui/card";

interface HoleDetailCardProps {
  score: Score;
}

export function HoleDetailCard({ score }: HoleDetailCardProps) {
  const sym = getScoreSymbol(score.score, score.par);
  const diff = score.score - score.par;
  const diffText = diff > 0 ? `+${diff}` : diff === 0 ? "E" : `${diff}`;

  const hasShotsDetail =
    score.shots_detail != null &&
    Array.isArray(score.shots_detail) &&
    score.shots_detail.length > 0;

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        {/* Header: Hole badge + Par + Distance + Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg">
              {score.hole_number}
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Par {score.par}
                {score.distance && (
                  <span className="ml-2">{score.distance}yd</span>
                )}
              </div>
              <div className={`text-sm font-semibold ${sym.color}`}>
                {sym.label} ({diffText})
              </div>
            </div>
          </div>
          <ScoreDisplay score={score.score} par={score.par} size="md" />
        </div>

        {/* Basic stats row */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <StatItem label="スコア" value={`${score.score} (${diffText})`} />
          <StatItem label="パット" value={`${score.putts}`} />
          <StatItem
            label="FW"
            value={
              score.par <= 3
                ? "-"
                : getFairwaySymbol(score.fairway_result as FairwayResult).symbol +
                  " " +
                  getFairwaySymbol(score.fairway_result as FairwayResult).label
            }
          />
          <StatItem label="OB" value={`${score.ob}`} highlight={score.ob > 0} />
          <StatItem label="バンカー" value={`${score.bunker}`} highlight={score.bunker > 0} />
          <StatItem label="ペナルティ" value={`${score.penalty}`} highlight={score.penalty > 0} />
        </div>

        {/* Shot detail section */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">ショット詳細</h4>
          {hasShotsDetail ? (
            <ShotDetailView shotsDetail={score.shots_detail} />
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              ショット詳細データがありません
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center py-2 rounded-md bg-muted/30">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? "text-red-600" : ""}`}>{value}</p>
    </div>
  );
}
