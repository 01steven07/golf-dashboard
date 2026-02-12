"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { MemberStats, DistanceBucket } from "@/types/database";
import {
  calculateMemberStats,
  calculateDetailedStats,
  getRankedStats,
  getStatValue,
  getCategoryDescription,
  RankingCategory,
  DetailedRoundData,
} from "@/utils/ranking";
import { getRankableStatsByGroup } from "@/utils/stat-definitions";
import { DistanceRateChart } from "@/components/distance-rate-chart";

const rankableGroups = getRankableStatsByGroup();

export default function DashboardPage() {
  const [stats, setStats] = useState<MemberStats[]>([]);
  const [makePctByDistance, setMakePctByDistance] = useState<DistanceBucket[]>([]);
  const [girByDistance, setGirByDistance] = useState<DistanceBucket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(rankableGroups[0]?.group.key ?? "core");

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
          scores(hole_number, par, score, putts, fairway_result, distance, shots_detail)
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
          hole_number: number;
          par: number;
          score: number;
          putts: number;
          fairway_result: string;
          distance: number | null;
          shots_detail: unknown[] | null;
        }[],
      }));

      const calculatedStats = calculateMemberStats(roundData);
      setStats(calculatedStats);

      // Calculate aggregate distance-based stats from all rounds
      const allDetailedRounds: DetailedRoundData[] = roundData.map((r) => ({
        member_id: r.member_id,
        scores: r.scores.map((s) => ({
          hole_number: s.hole_number,
          par: s.par,
          score: s.score,
          putts: s.putts,
          distance: s.distance,
          shots_detail: s.shots_detail,
        })),
      }));
      const aggregateDetailed = calculateDetailedStats(allDetailedRounds);
      setMakePctByDistance(aggregateDetailed.make_pct_by_distance);
      setGirByDistance(aggregateDetailed.gir_by_distance);

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

  // Get stats for currently selected group
  const currentGroupData = rankableGroups.find((g) => g.group.key === selectedGroup);
  const currentStats = currentGroupData?.stats ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">総合ランキング</h2>
      <p className="text-sm text-muted-foreground">直近5ラウンドの成績で集計</p>

      {/* Group selector (upper row) */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {rankableGroups.map((g) => (
          <button
            key={g.group.key}
            onClick={() => setSelectedGroup(g.group.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              selectedGroup === g.group.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {g.group.label}
          </button>
        ))}
      </div>

      {/* Stats tabs (lower row) */}
      {currentStats.length > 0 && (
        <Tabs defaultValue={currentStats[0].key} key={selectedGroup}>
          <TabsList className="flex flex-wrap w-full !h-auto gap-1 p-1">
            {currentStats.map((stat) => (
              <TabsTrigger key={stat.key} value={stat.key} className="text-xs">
                {stat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {currentStats.map((statDef) => {
            const category = statDef.key as RankingCategory;
            const rankedStats = getRankedStats(stats, category);
            return (
              <TabsContent key={statDef.key} value={statDef.key} className="mt-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span>{statDef.label} ランキング</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {getCategoryDescription(category)}
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
                                {getStatValue(stat, category)}
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
      )}

      {/* Distance-based charts for shot group */}
      {selectedGroup === "shot" && !isLoading && (makePctByDistance.length > 0 || girByDistance.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>距離別スタッツ（全体集計）</CardTitle>
            <p className="text-sm text-muted-foreground">
              詳細入力データがある全ラウンドの集計
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {makePctByDistance.length > 0 && (
              <DistanceRateChart
                data={makePctByDistance}
                title="距離別カップイン率"
                color="#3b82f6"
              />
            )}
            {girByDistance.length > 0 && (
              <DistanceRateChart
                data={girByDistance}
                title="距離別パーオン率"
                color="#22c55e"
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
