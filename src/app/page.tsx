"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { MemberStats } from "@/types/database";
import {
  calculateMemberStats,
  getRankedStats,
  getStatValue,
  getCategoryDescription,
  RankingCategory,
} from "@/utils/ranking";

const rankingCategories: { value: RankingCategory; label: string }[] = [
  { value: "gross", label: "GROSS" },
  { value: "putt", label: "PUTT" },
  { value: "gir", label: "GIR" },
  { value: "keep", label: "KEEP" },
  { value: "birdie", label: "BIRDIE" },
  { value: "scramble", label: "SCRAMBLE" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<MemberStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Fetch all rounds with scores and member info, ordered by date desc
      const { data: rounds, error } = await supabase
        .from("rounds")
        .select(
          `
          id,
          member_id,
          date,
          members!inner(name),
          scores(par, score, putts, fairway_result)
        `
        )
        .order("date", { ascending: false });

      if (error) {
        console.error("Failed to fetch rounds:", error);
        setIsLoading(false);
        return;
      }

      // Transform data for calculation
      const roundData = (rounds ?? []).map((r) => ({
        member_id: r.member_id,
        member_name: (r.members as unknown as { name: string }).name,
        scores: r.scores as {
          par: number;
          score: number;
          putts: number;
          fairway_result: string;
        }[],
      }));

      const calculatedStats = calculateMemberStats(roundData);
      setStats(calculatedStats);
      setIsLoading(false);
    }

    fetchData();
  }, []);

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500 text-white";
    if (rank === 2) return "bg-gray-400 text-white";
    if (rank === 3) return "bg-amber-700 text-white";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">総合ランキング</h2>
      <p className="text-sm text-muted-foreground">直近5ラウンドの成績で集計</p>

      <Tabs defaultValue="gross">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full !h-auto gap-1 p-1">
          {rankingCategories.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {rankingCategories.map((cat) => {
          const rankedStats = getRankedStats(stats, cat.value);
          return (
            <TabsContent key={cat.value} value={cat.value} className="mt-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span>{cat.label} ランキング</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {getCategoryDescription(cat.value)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-muted-foreground">読み込み中...</p>
                  ) : rankedStats.length === 0 ? (
                    <p className="text-muted-foreground">
                      データがありません。スコアを入力してください。
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {rankedStats.map((stat, index) => (
                        <div
                          key={stat.member_id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Badge className={getRankBadgeColor(index + 1)}>
                              {index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium">{stat.member_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {stat.round_count}ラウンド
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              {getStatValue(stat, cat.value)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
