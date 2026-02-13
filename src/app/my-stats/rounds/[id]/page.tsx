"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { Score } from "@/types/database";
import { calculateRoundSummary, formatRoundDate } from "@/utils/round-stats";
import { RoundSummaryStats } from "@/components/round-history/round-summary-stats";
import { ScorecardTable } from "@/components/round-history/scorecard-table";
import { ScoreDistributionChart } from "@/components/round-history/score-distribution-chart";

interface RoundDetail {
  id: string;
  member_id: string;
  date: string;
  tee_color: string | null;
  weather: string | null;
  out_course_name: string | null;
  in_course_name: string | null;
  courses: { id: string; name: string; pref: string | null } | null;
  scores: Score[];
}

export default function RoundDetailPage() {
  return (
    <RequireAuth>
      <RoundDetailContent />
    </RequireAuth>
  );
}

function RoundDetailContent() {
  const { member } = useAuth();
  const params = useParams();
  const roundId = params.id as string;

  const [round, setRound] = useState<RoundDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!member || !roundId) return;

    async function fetchRound() {
      const { data, error: fetchError } = await supabase
        .from("rounds")
        .select(
          `id, member_id, date, tee_color, weather, out_course_name, in_course_name,
          courses(id, name, pref),
          scores(id, round_id, hole_number, par, distance, score, putts, fairway_result, ob, bunker, penalty, pin_position, shots_detail)`
        )
        .eq("id", roundId)
        .single();

      if (fetchError) {
        console.error("Failed to fetch round:", fetchError);
        setError("ラウンドデータの取得に失敗しました。");
        setIsLoading(false);
        return;
      }

      if (!data) {
        setError("ラウンドが見つかりません。");
        setIsLoading(false);
        return;
      }

      // Auth check: only allow viewing own rounds
      if (data.member_id !== member!.id) {
        setError("このラウンドを閲覧する権限がありません。");
        setIsLoading(false);
        return;
      }

      setRound({
        id: data.id,
        member_id: data.member_id,
        date: data.date,
        tee_color: data.tee_color,
        weather: data.weather,
        out_course_name: data.out_course_name,
        in_course_name: data.in_course_name,
        courses: data.courses as unknown as { id: string; name: string; pref: string | null } | null,
        scores: (data.scores as unknown as Score[]) ?? [],
      });
      setIsLoading(false);
    }

    fetchRound();
  }, [member, roundId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          href="/my-stats"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          ラウンド履歴
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!round) return null;

  const scores = round.scores;
  const summary = calculateRoundSummary(scores);
  const courseName = round.courses?.name ?? "不明なコース";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/my-stats"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        ラウンド履歴
      </Link>

      {/* Round meta info */}
      <div>
        <h2 className="text-xl font-bold">{courseName}</h2>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-sm text-muted-foreground">
            {formatRoundDate(round.date)}
          </span>
          {round.tee_color && (
            <Badge variant="outline" className="text-xs">
              {round.tee_color}
            </Badge>
          )}
          {round.weather && (
            <Badge variant="outline" className="text-xs">
              {round.weather}
            </Badge>
          )}
          {round.out_course_name && round.in_course_name && (
            <span className="text-xs text-muted-foreground">
              {round.out_course_name} / {round.in_course_name}
            </span>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <RoundSummaryStats summary={summary} />

      {/* Scorecard */}
      <Card>
        <CardHeader>
          <CardTitle>スコアカード</CardTitle>
        </CardHeader>
        <CardContent>
          <ScorecardTable scores={scores} />
        </CardContent>
      </Card>

      {/* Score distribution */}
      <Card>
        <CardHeader>
          <CardTitle>スコア分布</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreDistributionChart scores={scores} />
        </CardContent>
      </Card>
    </div>
  );
}
