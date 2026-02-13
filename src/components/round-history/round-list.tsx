"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Score } from "@/types/database";
import { formatMonthGroup } from "@/utils/round-stats";
import { RoundCard } from "./round-card";
import { Loader2 } from "lucide-react";

interface RoundData {
  id: string;
  date: string;
  tee_color: string | null;
  weather: string | null;
  out_course_name: string | null;
  in_course_name: string | null;
  courses: { name: string; pref: string | null } | null;
  scores: Score[];
}

interface RoundHistoryTabProps {
  memberId: string;
}

export function RoundHistoryTab({ memberId }: RoundHistoryTabProps) {
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRounds() {
      const { data, error } = await supabase
        .from("rounds")
        .select(
          `id, date, tee_color, weather, out_course_name, in_course_name,
          courses(name, pref),
          scores(id, round_id, hole_number, par, distance, score, putts, fairway_result, ob, bunker, penalty, pin_position, shots_detail)`
        )
        .eq("member_id", memberId)
        .order("date", { ascending: false });

      if (error) {
        console.error("Failed to fetch rounds:", error);
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
        courses: r.courses as unknown as { name: string; pref: string | null } | null,
        scores: (r.scores as unknown as Score[]) ?? [],
      }));

      setRounds(roundData);
      setIsLoading(false);
    }

    fetchRounds();
  }, [memberId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
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
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            {group.month}
          </h3>
          <div className="space-y-2">
            {group.rounds.map((round) => (
              <RoundCard key={round.id} round={round} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
