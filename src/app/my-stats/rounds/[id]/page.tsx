"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Pencil, Eye, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { authFetch } from "@/lib/api-client";
import { Score, FairwayResult } from "@/types/database";
import { Shot } from "@/types/shot";
import { calculateRoundSummary, formatRoundDate } from "@/utils/round-stats";
import { RoundSummaryStats } from "@/components/round-history/round-summary-stats";
import { ScorecardTable } from "@/components/round-history/scorecard-table";
import { ScoreDistributionChart } from "@/components/round-history/score-distribution-chart";
import { HoleSelector } from "@/components/round-history/hole-selector";
import { HoleDetailCard } from "@/components/round-history/hole-detail-card";
import { HoleEditForm } from "@/components/round-history/hole-edit-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface RoundDetail {
  id: string;
  member_id: string;
  date: string;
  tee_color: string | null;
  weather: string | null;
  out_course_name: string | null;
  in_course_name: string | null;
  ext_course_labels: string[];
  courses: { id: string; name: string; pref: string | null } | null;
  scores: Score[];
}

async function fetchRoundData(roundId: string, memberId: string): Promise<RoundDetail> {
  const { data, error: fetchError } = await supabase
    .from("rounds")
    .select(
      `id, member_id, date, tee_color, weather, out_course_name, in_course_name, ext_course_labels,
      courses(id, name, pref),
      scores(id, round_id, hole_number, par, distance, score, putts, fairway_result, ob, bunker, penalty, pin_position, shots_detail)`
    )
    .eq("id", roundId)
    .single();

  if (fetchError) {
    throw new Error("ラウンドデータの取得に失敗しました。");
  }

  if (!data) {
    throw new Error("ラウンドが見つかりません。");
  }

  if (data.member_id !== memberId) {
    throw new Error("このラウンドを閲覧する権限がありません。");
  }

  return {
    id: data.id,
    member_id: data.member_id,
    date: data.date,
    tee_color: data.tee_color,
    weather: data.weather,
    out_course_name: data.out_course_name,
    in_course_name: data.in_course_name,
    ext_course_labels: (data.ext_course_labels as string[]) ?? [],
    courses: data.courses as unknown as { id: string; name: string; pref: string | null } | null,
    scores: (data.scores as unknown as Score[]) ?? [],
  };
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedHole, setSelectedHole] = useState(1);
  const [pendingSaveData, setPendingSaveData] = useState<{
    score_id: string;
    score: number;
    putts: number;
    fairway_result: FairwayResult;
    ob: number;
    bunker: number;
    penalty: number;
    pin_position: string | null;
    shots_detail: Shot[] | null;
  } | null>(null);

  useEffect(() => {
    if (!member || !roundId) return;

    let cancelled = false;

    fetchRoundData(roundId, member.id)
      .then((data) => {
        if (!cancelled) {
          setRound(data);
          setIsLoading(false);
          if (data.scores.length > 0) {
            const first = [...data.scores].sort((a, b) => a.hole_number - b.hole_number)[0];
            setSelectedHole(first.hole_number);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to fetch round:", err);
          setError(err.message);
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [member, roundId]);

  const refreshRound = async () => {
    if (!member || !roundId) return;
    try {
      const data = await fetchRoundData(roundId, member.id);
      setRound(data);
    } catch (err) {
      console.error("Failed to refresh round:", err);
    }
  };

  const handleSaveHole = async (data: {
    score_id: string;
    score: number;
    putts: number;
    fairway_result: FairwayResult;
    ob: number;
    bunker: number;
    penalty: number;
    pin_position: string | null;
    shots_detail: Shot[] | null;
  }) => {
    setPendingSaveData(data);
  };

  const executeSaveHole = async () => {
    if (!pendingSaveData) return;
    const data = pendingSaveData;
    setPendingSaveData(null);

    try {
      const res = await authFetch(`/api/rounds/${roundId}/scores`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "保存に失敗しました");
      }

      await refreshRound();
    } catch (err) {
      const message = err instanceof Error ? err.message : "保存に失敗しました";
      alert(message);
    }
  };

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
  const selectedScore = scores.find((s) => s.hole_number === selectedHole);
  const maxHoleNumber = scores.length > 0
    ? Math.max(...scores.map((s) => s.hole_number))
    : 0;
  const canAddHalf = maxHoleNumber > 0 && maxHoleNumber % 9 === 0 && maxHoleNumber + 9 <= 36;

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
      <div className="flex items-start justify-between">
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

        <div className="flex gap-2">
          {canAddHalf && !isEditMode && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/input/detailed?addToRound=${roundId}`}>
                <PlusCircle className="w-4 h-4 mr-1" />
                ハーフ追加
              </Link>
            </Button>
          )}
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode((prev) => !prev)}
            className={isEditMode ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {isEditMode ? (
              <>
                <Eye className="w-4 h-4 mr-1" />
                閲覧モード
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4 mr-1" />
                編集
              </>
            )}
          </Button>
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
          <ScorecardTable scores={scores} extCourseLabels={round.ext_course_labels} />
        </CardContent>
      </Card>

      {/* Hole selector + detail */}
      <Card>
        <CardHeader>
          <CardTitle>
            ホール詳細
            {isEditMode && (
              <Badge variant="secondary" className="ml-2 text-xs">
                編集モード
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <HoleSelector
            scores={scores}
            selectedHole={selectedHole}
            onSelect={setSelectedHole}
          />

          {selectedScore && (
            isEditMode ? (
              <HoleEditForm
                key={selectedScore.id}
                score={selectedScore}
                onSave={handleSaveHole}
                onCancel={() => setIsEditMode(false)}
              />
            ) : (
              <HoleDetailCard score={selectedScore} />
            )
          )}
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

      <ConfirmDialog
        open={pendingSaveData !== null}
        onOpenChange={(open) => { if (!open) setPendingSaveData(null); }}
        title="ホールデータを保存しますか？"
        description="編集内容を保存します。"
        confirmLabel="保存する"
        variant="confirm"
        onConfirm={executeSaveHole}
      />
    </div>
  );
}
