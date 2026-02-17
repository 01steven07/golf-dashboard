"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { authFetch } from "@/lib/api-client";
import { MemberStats, DetailedMemberStats, ClubType, Gender, PreferredTee } from "@/types/database";
import { calculateMemberStats, calculateDetailedStats, DetailedRoundData } from "@/utils/ranking";
import { calculateRadarData, calculateExtendedRadarData, calculateHoleAnalysis, RadarChartData, HoleAnalysis } from "@/utils/stats";
import { StatGroupSection } from "@/components/stat-group-section";
import { StatCard } from "@/components/stat-card";
import { getClubComparison, ClubComparison } from "@/utils/club-stats";
import { RankingCategory } from "@/utils/ranking";
import { DistanceRateChart } from "@/components/distance-rate-chart";
import { ClubSetEditor } from "@/components/club-set-editor";
import { CourseAnalysisTab } from "@/components/course-analysis-tab";
import { RoundHistoryTab } from "@/components/round-history/round-list";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Sparkles, Settings, Check, ChevronDown, ChevronUp } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export default function MyStatsPage() {
  return (
    <RequireAuth>
      <MyStatsContent />
    </RequireAuth>
  );
}

function MyStatsContent() {
  const { member, updateMember } = useAuth();
  const [myStats, setMyStats] = useState<MemberStats | null>(null);
  const [allStats, setAllStats] = useState<MemberStats[]>([]);
  const [radarData, setRadarData] = useState<RadarChartData[]>([]);
  const [extendedRadarData, setExtendedRadarData] = useState<RadarChartData[]>([]);
  const [detailedStats, setDetailedStats] = useState<DetailedMemberStats | null>(null);
  const [radarMode, setRadarMode] = useState<"basic" | "extended">("basic");
  const [holeAnalysis, setHoleAnalysis] = useState<HoleAnalysis[]>([]);
  const [roundScoreTrend, setRoundScoreTrend] = useState<{ date: string; score: number; par: number }[]>([]);
  const [advice, setAdvice] = useState<string>("");
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Profile editing state
  const [isProfileSectionOpen, setIsProfileSectionOpen] = useState(false);
  const [clubs, setClubs] = useState<ClubType[]>(member?.clubs || []);
  const [gender, setGender] = useState<Gender>(member?.gender || "male");
  const [preferredTee, setPreferredTee] = useState<PreferredTee>(member?.preferred_tee || "white");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState<string | null>(null);

  // Sync profile with member data
  useEffect(() => {
    if (member) {
      setClubs(member.clubs || []);
      setGender(member.gender || "male");
      setPreferredTee(member.preferred_tee || "white");
    }
  }, [member]);

  const handleSaveProfile = async () => {
    if (!member) return;

    setIsSavingProfile(true);
    setProfileSaveMessage(null);

    try {
      const res = await authFetch("/api/member/clubs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          clubs,
          gender,
          preferred_tee: preferredTee,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save profile");
      }

      const data = await res.json();
      updateMember({
        clubs: data.member.clubs,
        gender: data.member.gender,
        preferred_tee: data.member.preferred_tee,
      });
      setProfileSaveMessage("保存しました");
      setTimeout(() => setProfileSaveMessage(null), 2000);
    } catch {
      setProfileSaveMessage("保存に失敗しました");
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    if (!member) return;

    async function fetchData() {
      // Fetch all rounds with scores and member info (including distance and shots_detail)
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
      setAllStats(calculatedStats);

      // Find my stats
      const myMemberStats = calculatedStats.find((s) => s.member_id === member?.id);
      setMyStats(myMemberStats ?? null);

      if (myMemberStats && calculatedStats.length > 0) {
        setRadarData(calculateRadarData(myMemberStats, calculatedStats));
        setExtendedRadarData(calculateExtendedRadarData(myMemberStats, calculatedStats));
      }

      // Calculate hole analysis for my rounds (used by AI advisor)
      const myRounds = roundData.filter((r) => r.member_id === member?.id).slice(0, 10);
      const allMyScores = myRounds.flatMap((r) => r.scores);
      setHoleAnalysis(calculateHoleAnalysis(allMyScores));

      // Calculate round score trend (last 10 rounds)
      const myRawRounds = (rounds ?? [])
        .filter((r) => r.member_id === member?.id)
        .slice(0, 10);
      const trend = myRawRounds
        .map((r) => {
          const scoreArr = r.scores as { score: number; par: number; hole_number: number }[];
          const holeCount = scoreArr.length;
          const factor = holeCount > 0 && holeCount < 18 ? 18 / holeCount : 1;
          const rawScore = scoreArr.reduce((sum, s) => sum + s.score, 0);
          const rawPar = scoreArr.reduce((sum, s) => sum + s.par, 0);
          const d = new Date(r.date as string);
          return {
            date: `${d.getMonth() + 1}/${d.getDate()}`,
            score: Math.round(rawScore * factor),
            par: Math.round(rawPar * factor),
          };
        })
        .reverse();
      setRoundScoreTrend(trend);

      // Calculate detailed stats (shots_detail dependent)
      const myDetailedRounds: DetailedRoundData[] = myRounds.map((r) => ({
        member_id: r.member_id,
        scores: r.scores.map((s) => ({
          hole_number: s.hole_number,
          par: s.par,
          score: s.score,
          putts: s.putts,
          distance: s.distance ?? null,
          shots_detail: s.shots_detail ?? null,
        })),
      }));
      const detailed = calculateDetailedStats(myDetailedRounds);
      setDetailedStats(detailed);

      setIsLoading(false);
    }

    fetchData();
  }, [member]);

  const generateAdvice = async () => {
    if (!myStats || allStats.length === 0) return;

    setIsLoadingAdvice(true);
    setAdvice("");

    try {
      const n = allStats.length;
      const avgOf = (fn: (s: MemberStats) => number) =>
        allStats.reduce((sum, s) => sum + fn(s), 0) / n;

      const allStatsAvg = {
        avg_score: avgOf((s) => s.avg_score),
        avg_putts: avgOf((s) => s.avg_putts),
        gir_rate: avgOf((s) => s.gir_rate),
        fairway_keep_rate: avgOf((s) => s.fairway_keep_rate),
        avg_birdies: avgOf((s) => s.avg_birdies),
        scramble_rate: avgOf((s) => s.scramble_rate),
        par3_avg: avgOf((s) => s.par3_avg),
        par4_avg: avgOf((s) => s.par4_avg),
        par5_avg: avgOf((s) => s.par5_avg),
        bounce_back_rate: avgOf((s) => s.bounce_back_rate),
        bogey_avoidance: avgOf((s) => s.bogey_avoidance),
        double_bogey_avoidance: avgOf((s) => s.double_bogey_avoidance),
        putts_per_gir: avgOf((s) => s.putts_per_gir),
        three_putt_avoidance: avgOf((s) => s.three_putt_avoidance),
        one_putt_rate: avgOf((s) => s.one_putt_rate),
        gir_from_fairway: avgOf((s) => s.gir_from_fairway),
        gir_from_rough: avgOf((s) => s.gir_from_rough),
      };

      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats: myStats,
          holeAnalysis,
          allStatsAvg,
          detailedStats,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate advice");

      const data = await res.json();
      setAdvice(data.advice);
    } catch (err) {
      console.error(err);
      setAdvice("アドバイスの生成に失敗しました。");
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  // 全スタッツの部内比較データを一括計算
  const clubComparisons = useMemo(() => {
    if (!member || allStats.length === 0) return {} as Record<RankingCategory, ClubComparison | null>;
    const categories: RankingCategory[] = [
      "gross", "putt", "gir", "keep", "birdie", "scramble",
      "par3_avg", "par4_avg", "par5_avg", "bounce_back", "bogey_avoidance", "double_bogey_avoidance",
      "putts_per_gir", "three_putt_avoidance", "one_putt_rate",
      "gir_from_fairway", "gir_from_rough", "sand_save", "driving_distance",
    ];
    const result: Partial<Record<RankingCategory, ClubComparison | null>> = {};
    for (const cat of categories) {
      result[cat] = getClubComparison(allStats, member.id, cat);
    }
    return result as Record<RankingCategory, ClubComparison | null>;
  }, [allStats, member]);

  /** ClubComparison をスプレッド用のオブジェクトに変換 */
  const comp = (cat: RankingCategory) => {
    const c = clubComparisons[cat];
    return c ? { clubAvg: c.clubAvg, rank: c.rank, totalMembers: c.totalMembers } : {};
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!myStats) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">マイページ</h2>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            まだラウンドデータがありません。スコアを入力してください。
          </CardContent>
        </Card>

        {/* Profile Settings - always show even without round data */}
        <Card>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setIsProfileSectionOpen(!isProfileSectionOpen)}
          >
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                プロフィール設定
              </span>
              {isProfileSectionOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CardTitle>
          </CardHeader>
          {isProfileSectionOpen && (
            <CardContent className="space-y-6">
              {/* Gender & Tee */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">性別</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="male">男性</option>
                    <option value="female">女性</option>
                    <option value="other">その他</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">利用ティー</label>
                  <div className="flex gap-1">
                    {[
                      { value: "black", label: "黒", color: "bg-gray-800 text-white" },
                      { value: "blue", label: "青", color: "bg-blue-500 text-white" },
                      { value: "white", label: "白", color: "bg-white text-gray-800 border border-gray-300" },
                      { value: "red", label: "赤", color: "bg-red-500 text-white" },
                      { value: "green", label: "緑", color: "bg-green-500 text-white" },
                    ].map((tee) => (
                      <button
                        key={tee.value}
                        type="button"
                        onClick={() => setPreferredTee(tee.value as PreferredTee)}
                        className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${tee.color} ${
                          preferredTee === tee.value
                            ? "ring-2 ring-offset-1 ring-primary"
                            : "opacity-50 hover:opacity-100"
                        }`}
                      >
                        {tee.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Club Set */}
              <div className="space-y-2">
                <label className="text-sm font-medium">クラブセット ({clubs.length}本)</label>
                <ClubSetEditor value={clubs} onChange={setClubs} />
              </div>

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "保存"
                  )}
                </Button>
                {profileSaveMessage && (
                  <span className={`text-sm flex items-center gap-1 ${profileSaveMessage.includes("失敗") ? "text-destructive" : "text-green-600"}`}>
                    {!profileSaveMessage.includes("失敗") && <Check className="h-4 w-4" />}
                    {profileSaveMessage}
                  </span>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">マイページ</h2>
      <p className="text-sm text-muted-foreground">
        {member?.name}さんのスタッツと分析結果
      </p>

      <Tabs defaultValue="overall">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="overall">総合分析</TabsTrigger>
          <TabsTrigger value="course">コース分析</TabsTrigger>
          <TabsTrigger value="rounds">ラウンド履歴</TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="space-y-6 mt-4">
          <p className="text-xs text-muted-foreground">直近10ラウンド</p>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>能力レーダーチャート</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setRadarMode("basic")}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        radarMode === "basic"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      基本
                    </button>
                    <button
                      type="button"
                      onClick={() => setRadarMode("extended")}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        radarMode === "extended"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      拡張
                    </button>
                  </div>
                </CardTitle>
                <p className="text-xs text-muted-foreground">部内平均=50の偏差値表示</p>
              </CardHeader>
              <CardContent className="h-72">
                {(radarMode === "basic" ? radarData : extendedRadarData).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarMode === "basic" ? radarData : extendedRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[20, 80]} tick={{ fontSize: 10 }} />
                      <Radar
                        name="能力値"
                        dataKey="value"
                        stroke={radarMode === "basic" ? "#22c55e" : "#3b82f6"}
                        fill={radarMode === "basic" ? "#22c55e" : "#3b82f6"}
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    データが不足しています
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>スコア推移</CardTitle>
                <p className="text-xs text-muted-foreground">直近10ラウンドのスコア推移（18H換算）</p>
              </CardHeader>
              <CardContent className="h-72">
                {roundScoreTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={roundScoreTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
                      <Tooltip
                        formatter={(value, name) => [
                          value,
                          name === "score" ? "スコア" : "パー",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="par"
                        stroke="#9ca3af"
                        strokeDasharray="5 5"
                        dot={false}
                        name="par"
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#22c55e" }}
                        activeDot={{ r: 6 }}
                        name="score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    データが不足しています
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AIコーチ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!advice && !isLoadingAdvice && (
                <Button onClick={generateAdvice} className="w-full md:w-auto">
                  <Sparkles className="h-4 w-4 mr-2" />
                  アドバイスを生成
                </Button>
              )}
              {isLoadingAdvice && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  アドバイスを生成中...
                </div>
              )}
              {advice && (
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{advice}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateAdvice}
                    className="mt-4"
                    disabled={isLoadingAdvice}
                  >
                    再生成
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>コアスタッツ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="平均スコア" value={myStats.avg_score.toFixed(1)} description="平均スコア" {...comp("gross")} />
                <StatCard label="平均パット" value={myStats.avg_putts.toFixed(1)} description="平均パット数" {...comp("putt")} />
                <StatCard label="パーオン率" value={`${myStats.gir_rate.toFixed(1)}%`} description="パーオン率" {...comp("gir")} />
                <StatCard label="FWキープ率" value={`${myStats.fairway_keep_rate.toFixed(1)}%`} description="フェアウェイキープ率" {...comp("keep")} />
                <StatCard label="平均バーディー" value={myStats.avg_birdies.toFixed(2)} description="平均バーディー数" {...comp("birdie")} />
                <StatCard label="リカバリー率" value={`${myStats.scramble_rate.toFixed(1)}%`} description="リカバリー率" {...comp("scramble")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>詳細スタッツ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <StatGroupSection
                title="スコアリング"
                stats={[
                  { label: "Par3平均", value: myStats.par3_avg.toFixed(1), description: "Par3ホールの平均スコア", ...comp("par3_avg") },
                  { label: "Par4平均", value: myStats.par4_avg.toFixed(1), description: "Par4ホールの平均スコア", ...comp("par4_avg") },
                  { label: "Par5平均", value: myStats.par5_avg.toFixed(1), description: "Par5ホールの平均スコア", ...comp("par5_avg") },
                  { label: "バウンスバック率", value: `${myStats.bounce_back_rate.toFixed(1)}%`, description: "ボギー以上の次ホールでパー以下を取れた率", ...comp("bounce_back") },
                  { label: "ボギー回避率", value: `${myStats.bogey_avoidance.toFixed(1)}%`, description: "ボギー以下を叩かなかった割合", ...comp("bogey_avoidance") },
                  { label: "ダボ回避率", value: `${myStats.double_bogey_avoidance.toFixed(1)}%`, description: "ダブルボギー以下を叩かなかった割合", ...comp("double_bogey_avoidance") },
                ]}
              />

              <StatGroupSection
                title="パッティング"
                stats={[
                  { label: "パーオン時パット", value: myStats.putts_per_gir.toFixed(1), description: "パーオンホールでの平均パット数", ...comp("putts_per_gir") },
                  { label: "3パット回避率", value: `${myStats.three_putt_avoidance.toFixed(1)}%`, description: "3パット以上にならなかった割合", ...comp("three_putt_avoidance") },
                  { label: "1パット率", value: `${myStats.one_putt_rate.toFixed(1)}%`, description: "1パットで沈めた割合", ...comp("one_putt_rate") },
                ]}
              />

              <StatGroupSection
                title="ショット"
                stats={[
                  { label: "パーオン率(FW)", value: `${myStats.gir_from_fairway.toFixed(1)}%`, description: "フェアウェイからのパーオン率", ...comp("gir_from_fairway") },
                  { label: "パーオン率(ラフ)", value: `${myStats.gir_from_rough.toFixed(1)}%`, description: "ラフからのパーオン率", ...comp("gir_from_rough") },
                  {
                    label: "サンドセーブ率",
                    value: detailedStats?.sand_save_rate != null ? `${detailedStats.sand_save_rate.toFixed(1)}%` : "-",
                    description: "グリーン周りバンカーからパー以上の率",
                    unavailable: detailedStats?.sand_save_rate == null,
                    ...comp("sand_save"),
                  },
                  {
                    label: "平均飛距離",
                    value: detailedStats?.avg_driving_distance != null ? `${detailedStats.avg_driving_distance.toFixed(0)}yd` : "-",
                    description: "Par4でのティーショット推定飛距離",
                    unavailable: detailedStats?.avg_driving_distance == null,
                    ...comp("driving_distance"),
                  },
                ]}
              />

              {/* Distance-based charts */}
              {detailedStats && detailedStats.make_pct_by_distance.length > 0 && (
                <DistanceRateChart
                  data={detailedStats.make_pct_by_distance}
                  title="距離別カップイン率"
                  color="#3b82f6"
                />
              )}
              {detailedStats && detailedStats.gir_by_distance.length > 0 && (
                <DistanceRateChart
                  data={detailedStats.gir_by_distance}
                  title="距離別パーオン率"
                  color="#22c55e"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="course" className="mt-4">
          <CourseAnalysisTab memberId={member!.id} />
        </TabsContent>

        <TabsContent value="rounds" className="mt-4">
          <RoundHistoryTab memberId={member!.id} />
        </TabsContent>
      </Tabs>

      {/* Profile Settings */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setIsProfileSectionOpen(!isProfileSectionOpen)}
        >
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              プロフィール設定
            </span>
            {isProfileSectionOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CardTitle>
        </CardHeader>
        {isProfileSectionOpen && (
          <CardContent className="space-y-6">
            {/* Gender & Tee */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">性別</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">利用ティー</label>
                <div className="flex gap-1">
                  {[
                    { value: "black", label: "黒", color: "bg-gray-800 text-white" },
                    { value: "blue", label: "青", color: "bg-blue-500 text-white" },
                    { value: "white", label: "白", color: "bg-white text-gray-800 border border-gray-300" },
                    { value: "red", label: "赤", color: "bg-red-500 text-white" },
                    { value: "green", label: "緑", color: "bg-green-500 text-white" },
                  ].map((tee) => (
                    <button
                      key={tee.value}
                      type="button"
                      onClick={() => setPreferredTee(tee.value as PreferredTee)}
                      className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${tee.color} ${
                        preferredTee === tee.value
                          ? "ring-2 ring-offset-1 ring-primary"
                          : "opacity-50 hover:opacity-100"
                      }`}
                    >
                      {tee.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Club Set */}
            <div className="space-y-2">
              <label className="text-sm font-medium">クラブセット ({clubs.length}本)</label>
              <ClubSetEditor value={clubs} onChange={setClubs} />
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存"
                )}
              </Button>
              {profileSaveMessage && (
                <span className={`text-sm flex items-center gap-1 ${profileSaveMessage.includes("失敗") ? "text-destructive" : "text-green-600"}`}>
                  {!profileSaveMessage.includes("失敗") && <Check className="h-4 w-4" />}
                  {profileSaveMessage}
                </span>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
