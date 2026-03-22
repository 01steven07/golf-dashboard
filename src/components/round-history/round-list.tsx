"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Score } from "@/types/database";
import { formatMonthGroup } from "@/utils/round-stats";
import { RoundCard } from "./round-card";
import { Loader2 } from "lucide-react";
import { FetchError } from "@/components/fetch-error";
import { getFallbackSectionLabels } from "@/utils/resolve-section-labels";

interface RoundData {
  id: string;
  date: string;
  tee_color: string | null;
  weather: string | null;
  out_course_name: string | null;
  in_course_name: string | null;
  ext_course_labels: string[];
  played_sub_course_ids: string[];
  courses: { name: string; pref: string | null } | null;
  scores: Score[];
}

interface RoundHistoryTabProps {
  memberId: string;
}

export function RoundHistoryTab({ memberId }: RoundHistoryTabProps) {
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [subCourseNameMap, setSubCourseNameMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchRounds = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    const { data, error } = await supabase
      .from("rounds")
      .select(
        `id, date, tee_color, weather, out_course_name, in_course_name, ext_course_labels, played_sub_course_ids,
        courses(name, pref),
        scores(id, round_id, hole_number, par, distance, score, putts, fairway_result, ob, bunker, penalty, pin_position, shots_detail, course_hole_id)`
      )
      .eq("member_id", memberId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Failed to fetch rounds:", error);
      setFetchError("ラウンド履歴の取得に失敗しました。通信状況を確認してください。");
      setIsLoading(false);
      return;
    }

    const roundData: RoundData[] = (data ?? []).map((r) => ({
      id: r.id,
      date: r.date,
      tee_color: r.tee_color,
      weather: r.weather,
      out_course_name: r.out_course_name,
      in_course_name: r.in_course_name,
      ext_course_labels: (r.ext_course_labels as string[]) ?? [],
      played_sub_course_ids: (r.played_sub_course_ids as string[]) ?? [],
      courses: r.courses as unknown as { name: string; pref: string | null } | null,
      scores: (r.scores as unknown as Score[]) ?? [],
    }));

    setRounds(roundData);

    // 全ラウンドの played_sub_course_ids を集めて一括でサブコース名を取得
    const allSubCourseIds = new Set<string>();
    for (const r of roundData) {
      for (const id of r.played_sub_course_ids) {
        allSubCourseIds.add(id);
      }
    }
    if (allSubCourseIds.size > 0) {
      const { data: scData } = await supabase
        .from("course_sub_courses")
        .select("id, name")
        .in("id", Array.from(allSubCourseIds));
      if (scData) {
        setSubCourseNameMap(new Map(scData.map((d) => [d.id, d.name])));
      }
    }

    setIsLoading(false);
  }, [memberId]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fetchError) {
    return <FetchError message={fetchError} onRetry={fetchRounds} />;
  }

  if (rounds.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        まだラウンドデータがありません。スコアを入力してください。
      </div>
    );
  }

  // Group by month
  const grouped: { month: string; rounds: RoundData[] }[] = [];
  let currentMonth = "";

  for (const round of rounds) {
    const month = formatMonthGroup(round.date);
    if (month !== currentMonth) {
      currentMonth = month;
      grouped.push({ month, rounds: [] });
    }
    grouped[grouped.length - 1].rounds.push(round);
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">全{rounds.length}ラウンド</p>
      {grouped.map((group) => (
        <div key={group.month}>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">{group.month}</h3>
          <div className="space-y-2">
            {group.rounds.map((round) => {
              const labels =
                round.played_sub_course_ids.length > 0
                  ? round.played_sub_course_ids.map((id) => subCourseNameMap.get(id) ?? "???")
                  : getFallbackSectionLabels(
                      round.out_course_name,
                      round.in_course_name,
                      round.ext_course_labels
                    );
              return <RoundCard key={round.id} round={round} sectionLabels={labels} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
