"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { MemberStats, ClubType, Gender, PreferredTee } from "@/types/database";
import { calculateMemberStats } from "@/utils/ranking";
import { calculateRadarData, calculateHoleAnalysis, RadarChartData, HoleAnalysis } from "@/utils/stats";
import { ClubSetEditor } from "@/components/club-set-editor";
import { Loader2, Sparkles, Settings, Check, ChevronDown, ChevronUp } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
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
  const [holeAnalysis, setHoleAnalysis] = useState<HoleAnalysis[]>([]);
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
      const res = await fetch("/api/member/clubs", {
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
      // Fetch all rounds with scores and member info
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
      setAllStats(calculatedStats);

      // Find my stats
      const myMemberStats = calculatedStats.find((s) => s.member_id === member?.id);
      setMyStats(myMemberStats ?? null);

      if (myMemberStats && calculatedStats.length > 0) {
        setRadarData(calculateRadarData(myMemberStats, calculatedStats));
      }

      // Calculate hole analysis for my rounds
      const myRounds = roundData.filter((r) => r.member_id === member?.id).slice(0, 5);
      const allMyScores = myRounds.flatMap((r) => r.scores);
      setHoleAnalysis(calculateHoleAnalysis(allMyScores));

      setIsLoading(false);
    }

    fetchData();
  }, [member]);

  const generateAdvice = async () => {
    if (!myStats || allStats.length === 0) return;

    setIsLoadingAdvice(true);
    setAdvice("");

    try {
      const allStatsAvg = {
        avg_score: allStats.reduce((sum, s) => sum + s.avg_score, 0) / allStats.length,
        avg_putts: allStats.reduce((sum, s) => sum + s.avg_putts, 0) / allStats.length,
        gir_rate: allStats.reduce((sum, s) => sum + s.gir_rate, 0) / allStats.length,
        fairway_keep_rate:
          allStats.reduce((sum, s) => sum + s.fairway_keep_rate, 0) / allStats.length,
        scramble_rate: allStats.reduce((sum, s) => sum + s.scramble_rate, 0) / allStats.length,
      };

      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats: myStats,
          holeAnalysis,
          allStatsAvg,
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

  const barColors = ["#22c55e", "#3b82f6", "#f59e0b"];

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
        {member?.name}さんのスタッツと分析結果（直近5ラウンド）
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>能力レーダーチャート</CardTitle>
            <p className="text-xs text-muted-foreground">部内平均=50の偏差値表示</p>
          </CardHeader>
          <CardContent className="h-72">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[20, 80]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="能力値"
                    dataKey="value"
                    stroke="#22c55e"
                    fill="#22c55e"
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
            <CardTitle>ホール別分析</CardTitle>
            <p className="text-xs text-muted-foreground">Par別の平均スコア</p>
          </CardHeader>
          <CardContent className="h-72">
            {holeAnalysis.some((h) => h.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={holeAnalysis} layout="vertical">
                  <XAxis type="number" domain={[0, "auto"]} />
                  <YAxis type="category" dataKey="parType" width={50} />
                  <Tooltip
                    formatter={(value) => [Number(value).toFixed(2), "平均スコア"]}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="avgScore" radius={[0, 4, 4, 0]}>
                    {holeAnalysis.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index]} />
                    ))}
                  </Bar>
                </BarChart>
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
          <CardTitle>スタッツ詳細</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">平均スコア</p>
              <p className="text-2xl font-bold">{myStats.avg_score.toFixed(1)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">平均パット</p>
              <p className="text-2xl font-bold">{myStats.avg_putts.toFixed(1)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">パーオン率</p>
              <p className="text-2xl font-bold">{myStats.gir_rate.toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">FWキープ率</p>
              <p className="text-2xl font-bold">{myStats.fairway_keep_rate.toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">平均バーディー</p>
              <p className="text-2xl font-bold">{myStats.avg_birdies.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">リカバリー率</p>
              <p className="text-2xl font-bold">{myStats.scramble_rate.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
