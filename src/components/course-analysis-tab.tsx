"use client";

import { useEffect, useState, useMemo, useCallback, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { PinPosition } from "@/types/database";
import {
  calculateCourseBasicStats,
  calculateScoreDistribution,
  calculateHoleScorePattern,
  calculateTeeShotTendency,
  calculateApproachClubs,
  calculateTeeShotClubs,
  calculatePinPositionScores,
  calculateCourseScoringStats,
  calculateCoursePuttingStats,
  calculateCourseShotStats,
  calculateHoleGirRate,
  calculateHoleAvgPutts,
  calculateHoleScrambleRate,
  calculateHoleScoreDistribution,
  CourseScoringStats,
  CoursePuttingStats,
  CourseShotStats,
} from "@/utils/course-stats";
import { StatGroupSection } from "@/components/stat-group-section";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  Loader2, Trophy, Crosshair, TreePine, RotateCcw,
  Flag, TrendingUp, Triangle, Square, Star,
  Locate, Trees,
} from "lucide-react";
import { FetchError } from "@/components/fetch-error";

/** パターアイコン */
function PutterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <line x1="7" y1="1" x2="7" y2="10" />
      <line x1="4" y1="10.5" x2="10" y2="10.5" strokeWidth="2" />
    </svg>
  );
}

interface CourseOption {
  id: string;
  name: string;
  pref: string | null;
}

interface ScoreRow {
  hole_number: number;
  par: number;
  score: number;
  putts: number;
  fairway_result: string;
  pin_position: PinPosition | null;
  shots_detail: unknown[] | null;
}

interface RoundWithScores {
  id: string;
  date: string;
  out_course_name: string | null;
  in_course_name: string | null;
  scores: ScoreRow[];
}

interface TeamRound {
  member_id: string;
  scores: ScoreRow[];
}

interface CourseAnalysisTabProps {
  memberId: string;
}

// スコア種別カラーをアプリ全体で統一
import { SCORE_COLORS } from "@/utils/score-colors";
const PIE_COLORS = SCORE_COLORS;

const PIN_POSITIONS: { key: PinPosition; label: string; row: number; col: number }[] = [
  { key: "front-left", label: "FL", row: 0, col: 0 },
  { key: "front-center", label: "FC", row: 0, col: 1 },
  { key: "front-right", label: "FR", row: 0, col: 2 },
  { key: "middle-left", label: "ML", row: 1, col: 0 },
  { key: "center", label: "C", row: 1, col: 1 },
  { key: "middle-right", label: "MR", row: 1, col: 2 },
  { key: "back-left", label: "BL", row: 2, col: 0 },
  { key: "back-center", label: "BC", row: 2, col: 1 },
  { key: "back-right", label: "BR", row: 2, col: 2 },
];

function getPinColor(avgOverPar: number | null): string {
  if (avgOverPar === null) return "bg-muted text-muted-foreground";
  if (avgOverPar <= 0) return "bg-green-500 text-white";
  if (avgOverPar <= 1) return "bg-yellow-400 text-gray-900";
  return "bg-red-500 text-white";
}

export function CourseAnalysisTab({ memberId }: CourseAnalysisTabProps) {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [myRounds, setMyRounds] = useState<RoundWithScores[]>([]);
  const [teamRounds, setTeamRounds] = useState<TeamRound[]>([]);
  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fetchCoursesError, setFetchCoursesError] = useState<string | null>(null);
  const [fetchDataError, setFetchDataError] = useState<string | null>(null);

  // Fetch played courses
  const fetchCourses = useCallback(async () => {
    setIsLoadingCourses(true);
    setFetchCoursesError(null);

    const { data, error } = await supabase
      .from("rounds")
      .select("course_id, courses!inner(id, name, pref)")
      .eq("member_id", memberId)
      .not("course_id", "is", null);

    if (error) {
      console.error("Failed to fetch courses:", error);
      setFetchCoursesError("コース一覧の取得に失敗しました。通信状況を確認してください。");
      setIsLoadingCourses(false);
      return;
    }

    const courseMap = new Map<string, CourseOption>();
    for (const row of data ?? []) {
      const course = row.courses as unknown as { id: string; name: string; pref: string | null };
      if (!courseMap.has(course.id)) {
        courseMap.set(course.id, { id: course.id, name: course.name, pref: course.pref });
      }
    }

    setCourses(Array.from(courseMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    setIsLoadingCourses(false);
  }, [memberId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Fetch data when course is selected
  const fetchCourseData = useCallback(async () => {
    if (!selectedCourseId) return;

    setIsLoadingData(true);
    setFetchDataError(null);
    setSelectedHole(null);

    const [myResult, teamResult] = await Promise.all([
      supabase
        .from("rounds")
        .select("id, date, out_course_name, in_course_name, scores(hole_number, par, score, putts, fairway_result, pin_position, shots_detail)")
        .eq("member_id", memberId)
        .eq("course_id", selectedCourseId)
        .order("date", { ascending: false }),
      supabase
        .from("rounds")
        .select("id, member_id, scores(hole_number, par, score, putts, fairway_result)")
        .eq("course_id", selectedCourseId)
        .order("date", { ascending: false }),
    ]);

    if (myResult.error || teamResult.error) {
      console.error("Failed to fetch course data:", myResult.error || teamResult.error);
      setFetchDataError("コースデータの取得に失敗しました。通信状況を確認してください。");
      setIsLoadingData(false);
      return;
    }

    setMyRounds(
      (myResult.data ?? []).map((r) => ({
        id: r.id,
        date: r.date,
        out_course_name: (r as Record<string, unknown>).out_course_name as string | null,
        in_course_name: (r as Record<string, unknown>).in_course_name as string | null,
        scores: (r.scores as ScoreRow[]) ?? [],
      }))
    );

    setTeamRounds(
      (teamResult.data ?? []).map((r) => ({
        member_id: r.member_id,
        scores: (r.scores as unknown as ScoreRow[]) ?? [],
      }))
    );

    setIsLoadingData(false);
  }, [memberId, selectedCourseId]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  // All my scores for this course (flat array)
  const allMyScores = useMemo(() => myRounds.flatMap((r) => r.scores), [myRounds]);

  // Stats calculations
  const myBasicStats = useMemo(
    () => calculateCourseBasicStats(myRounds),
    [myRounds]
  );
  const teamBasicStats = useMemo(
    () => calculateCourseBasicStats(teamRounds),
    [teamRounds]
  );
  const scoreDistribution = useMemo(
    () => calculateScoreDistribution(allMyScores),
    [allMyScores]
  );
  const holeScorePattern = useMemo(
    () => calculateHoleScorePattern(allMyScores),
    [allMyScores]
  );

  // Extended stats
  const courseScoringStats = useMemo(
    () => calculateCourseScoringStats(myRounds),
    [myRounds]
  );
  const coursePuttingStats = useMemo(
    () => calculateCoursePuttingStats(myRounds),
    [myRounds]
  );
  const courseShotStats = useMemo(
    () => calculateCourseShotStats(myRounds),
    [myRounds]
  );

  // Per-member course stats for club comparison
  const memberCourseStats = useMemo(() => {
    if (teamRounds.length === 0) return [];
    const grouped = new Map<string, TeamRound[]>();
    for (const r of teamRounds) {
      const existing = grouped.get(r.member_id);
      if (existing) existing.push(r);
      else grouped.set(r.member_id, [r]);
    }
    return Array.from(grouped.entries()).map(([mid, rounds]) => ({
      member_id: mid,
      basic: calculateCourseBasicStats(rounds),
      scoring: calculateCourseScoringStats(rounds),
      putting: calculateCoursePuttingStats(rounds),
      shot: calculateCourseShotStats(rounds),
    }));
  }, [teamRounds]);

  /** コース概要の部内順位を計算するヘルパー */
  const basicComp = (
    statKey: "avgScore" | "avgPutts" | "girRate" | "fairwayKeepRate",
    lowerIsBetter: boolean,
  ) => {
    if (memberCourseStats.length === 0) return { rank: 0, totalMembers: 0 };
    const sorted = [...memberCourseStats].sort((a, b) => {
      return lowerIsBetter
        ? a.basic[statKey] - b.basic[statKey]
        : b.basic[statKey] - a.basic[statKey];
    });
    const rank = sorted.findIndex((m) => m.member_id === memberId) + 1;
    return { rank: rank || 0, totalMembers: sorted.length };
  };

  /** コーススタッツの部内比較を計算するヘルパー */
  const courseComp = (
    accessor: (m: { scoring: CourseScoringStats; putting: CoursePuttingStats; shot: CourseShotStats }) => number,
    lowerIsBetter: boolean,
    format: "score" | "percent",
  ) => {
    if (memberCourseStats.length === 0) return {};
    const values = memberCourseStats.map((m) => accessor(m));
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const clubAvg = format === "percent" ? `${avg.toFixed(1)}%` : avg.toFixed(1);

    const sorted = [...memberCourseStats].sort((a, b) => {
      const aVal = accessor(a);
      const bVal = accessor(b);
      return lowerIsBetter ? aVal - bVal : bVal - aVal;
    });
    const rank = sorted.findIndex((m) => m.member_id === memberId) + 1;
    if (rank === 0) return {};

    return { clubAvg, rank, totalMembers: sorted.length };
  };

  // Sub-course labels (e.g. 東コース / 西コース)
  const subCourseLabels = useMemo(() => {
    // Find the most recent round with sub-course names
    const roundWithNames = myRounds.find((r) => r.out_course_name || r.in_course_name);
    if (!roundWithNames) return { out: "OUT", in: "IN" };
    return {
      out: roundWithNames.out_course_name || "OUT",
      in: roundWithNames.in_course_name || "IN",
    };
  }, [myRounds]);

  // Hole-specific calculations
  const holeTendency = useMemo(
    () => (selectedHole ? calculateTeeShotTendency(allMyScores, selectedHole) : null),
    [allMyScores, selectedHole]
  );
  const holeApproachClubs = useMemo(
    () => (selectedHole ? calculateApproachClubs(allMyScores, selectedHole) : []),
    [allMyScores, selectedHole]
  );
  const holePinScores = useMemo(
    () => (selectedHole ? calculatePinPositionScores(allMyScores, selectedHole) : []),
    [allMyScores, selectedHole]
  );

  // Selected hole's par
  const selectedHolePar = useMemo(() => {
    if (!selectedHole) return null;
    const score = allMyScores.find((s) => s.hole_number === selectedHole);
    return score?.par ?? null;
  }, [allMyScores, selectedHole]);

  // Number of holes (might not be 18)
  const holeCount = useMemo(() => {
    if (allMyScores.length === 0) return 18;
    return Math.max(...allMyScores.map((s) => s.hole_number));
  }, [allMyScores]);

  // Tee shot clubs for selected hole
  const holeTeeShotClubs = useMemo(
    () => (selectedHole ? calculateTeeShotClubs(allMyScores, selectedHole) : []),
    [allMyScores, selectedHole]
  );

  // Per-hole GIR rate
  const holeGir = useMemo(
    () => (selectedHole ? calculateHoleGirRate(allMyScores, selectedHole) : null),
    [allMyScores, selectedHole]
  );

  // Per-hole avg putts
  const holePutts = useMemo(
    () => (selectedHole ? calculateHoleAvgPutts(allMyScores, selectedHole) : null),
    [allMyScores, selectedHole]
  );

  // Per-hole scramble rate
  const holeScramble = useMemo(
    () => (selectedHole ? calculateHoleScrambleRate(allMyScores, selectedHole) : null),
    [allMyScores, selectedHole]
  );

  // Per-hole score distribution
  const holeScoreDist = useMemo(
    () => (selectedHole ? calculateHoleScoreDistribution(allMyScores, selectedHole) : null),
    [allMyScores, selectedHole]
  );

  // Has shots_detail for selected hole
  const hasDetailData = useMemo(() => {
    if (!selectedHole) return false;
    return allMyScores.some(
      (s) => s.hole_number === selectedHole && s.shots_detail && s.shots_detail.length > 0
    );
  }, [allMyScores, selectedHole]);

  // Has pin_position data for selected hole
  const hasPinData = useMemo(() => {
    if (!selectedHole) return false;
    return allMyScores.some((s) => s.hole_number === selectedHole && s.pin_position);
  }, [allMyScores, selectedHole]);

  if (fetchCoursesError) {
    return <FetchError message={fetchCoursesError} onRetry={fetchCourses} />;
  }

  if (isLoadingCourses) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          まだプレイしたコースがありません。スコアを入力してください。
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course selector */}
      <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="コースを選択してください" />
        </SelectTrigger>
        <SelectContent>
          {courses.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
              {c.pref ? ` (${c.pref})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!selectedCourseId && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            コースを選択してください
          </CardContent>
        </Card>
      )}

      {fetchDataError && (
        <FetchError message={fetchDataError} onRetry={fetchCourseData} />
      )}

      {isLoadingData && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {selectedCourseId && !isLoadingData && myRounds.length > 0 && (
        <>
          {/* Basic stats cards */}
          <div>
            <h3 className="text-lg font-semibold mb-3">コース概要</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <CourseOverviewCard
                label="平均スコア"
                value={myBasicStats.avgScore.toFixed(1)}
                icon={<Trophy className="h-3.5 w-3.5" />}
                myVal={myBasicStats.avgScore}
                teamVal={teamBasicStats.avgScore}
                teamRoundCount={teamBasicStats.roundCount}
                isLowerBetter
                {...basicComp("avgScore", true)}
              />
              <CourseOverviewCard
                label="平均パット"
                value={myBasicStats.avgPutts.toFixed(1)}
                icon={<PutterIcon className="h-3.5 w-3.5" />}
                myVal={myBasicStats.avgPutts}
                teamVal={teamBasicStats.avgPutts}
                teamRoundCount={teamBasicStats.roundCount}
                isLowerBetter
                {...basicComp("avgPutts", true)}
              />
              <CourseOverviewCard
                label="パーオン率"
                value={`${myBasicStats.girRate.toFixed(1)}%`}
                icon={<Crosshair className="h-3.5 w-3.5" />}
                myVal={myBasicStats.girRate}
                teamVal={teamBasicStats.girRate}
                teamRoundCount={teamBasicStats.roundCount}
                format="percent"
                {...basicComp("girRate", false)}
              />
              <CourseOverviewCard
                label="FWキープ率"
                value={`${myBasicStats.fairwayKeepRate.toFixed(1)}%`}
                icon={<TreePine className="h-3.5 w-3.5" />}
                myVal={myBasicStats.fairwayKeepRate}
                teamVal={teamBasicStats.fairwayKeepRate}
                teamRoundCount={teamBasicStats.roundCount}
                format="percent"
                {...basicComp("fairwayKeepRate", false)}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ラウンド数: 自分 {myBasicStats.roundCount}回 / チーム全体 {teamBasicStats.roundCount}回
            </p>
          </div>

          {/* Score distribution pie chart */}
          <Card>
            <CardHeader>
              <CardTitle>スコア分布</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {scoreDistribution.total > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Eagle-", value: scoreDistribution.eagle, color: PIE_COLORS.eagle },
                        { name: "Birdie", value: scoreDistribution.birdie, color: PIE_COLORS.birdie },
                        { name: "Par", value: scoreDistribution.par, color: PIE_COLORS.par },
                        { name: "Bogey", value: scoreDistribution.bogey, color: PIE_COLORS.bogey },
                        { name: "Double+", value: scoreDistribution.doublePlus, color: PIE_COLORS.doublePlus },
                      ].filter((d) => d.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                    >
                      {[
                        { name: "Eagle-", value: scoreDistribution.eagle, color: PIE_COLORS.eagle },
                        { name: "Birdie", value: scoreDistribution.birdie, color: PIE_COLORS.birdie },
                        { name: "Par", value: scoreDistribution.par, color: PIE_COLORS.par },
                        { name: "Bogey", value: scoreDistribution.bogey, color: PIE_COLORS.bogey },
                        { name: "Double+", value: scoreDistribution.doublePlus, color: PIE_COLORS.doublePlus },
                      ]
                        .filter((d) => d.value > 0)
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  データが不足しています
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hole score pattern line chart */}
          <Card>
            <CardHeader>
              <CardTitle>ホール別スコアパターン</CardTitle>
              <p className="text-xs text-muted-foreground">各ホールの平均オーバーパー</p>
            </CardHeader>
            <CardContent className="h-72">
              {holeScorePattern.some((h) => h.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={holeScorePattern}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="hole"
                      tick={{ fontSize: 12 }}
                      label={{ value: "ホール", position: "insideBottomRight", offset: -5, fontSize: 11 }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v: number) => (v > 0 ? `+${v}` : `${v}`)}
                      label={{ value: "±パー", angle: -90, position: "insideLeft", fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value) => {
                        const v = Number(value);
                        return [(v > 0 ? "+" : "") + v.toFixed(2), "平均オーバーパー"];
                      }}
                      labelFormatter={(label) => `Hole ${label}`}
                    />
                    <ReferenceLine
                      y={0}
                      stroke="#888"
                      strokeDasharray="3 3"
                      label={{ value: "Par", position: "right", fontSize: 11 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgOverPar"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#22c55e" }}
                      activeDot={{ r: 5 }}
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

          {/* Extended course stats */}
          <Card>
            <CardHeader>
              <CardTitle>詳細スタッツ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <StatGroupSection
                title="スコアリング"
                stats={[
                  { label: "Par3平均", value: courseScoringStats.par3Avg.toFixed(1), description: "Par3ホールの平均スコア", icon: <Flag className="h-3.5 w-3.5" />, ...courseComp((m) => m.scoring.par3Avg, true, "score") },
                  { label: "Par4平均", value: courseScoringStats.par4Avg.toFixed(1), description: "Par4ホールの平均スコア", icon: <Flag className="h-3.5 w-3.5" />, ...courseComp((m) => m.scoring.par4Avg, true, "score") },
                  { label: "Par5平均", value: courseScoringStats.par5Avg.toFixed(1), description: "Par5ホールの平均スコア", icon: <Flag className="h-3.5 w-3.5" />, ...courseComp((m) => m.scoring.par5Avg, true, "score") },
                  { label: "バウンスバック率", value: `${courseScoringStats.bounceBackRate.toFixed(1)}%`, description: "ボギー以上の次ホールでパー以下を取れた率", icon: <TrendingUp className="h-3.5 w-3.5" />, ...courseComp((m) => m.scoring.bounceBackRate, false, "percent") },
                  { label: "ボギー回避率", value: `${courseScoringStats.bogeyAvoidance.toFixed(1)}%`, description: "ボギー以下を叩かなかった割合", icon: <Triangle className="h-3.5 w-3.5" />, ...courseComp((m) => m.scoring.bogeyAvoidance, false, "percent") },
                  { label: "ダボ回避率", value: `${courseScoringStats.doubleBogeyAvoidance.toFixed(1)}%`, description: "ダブルボギー以下を叩かなかった割合", icon: <Square className="h-3.5 w-3.5" />, ...courseComp((m) => m.scoring.doubleBogeyAvoidance, false, "percent") },
                ]}
              />

              <StatGroupSection
                title="パッティング"
                stats={[
                  { label: "パーオン時パット", value: coursePuttingStats.puttsPerGir.toFixed(1), description: "パーオンホールでの平均パット数", icon: <PutterIcon className="h-3.5 w-3.5" />, ...courseComp((m) => m.putting.puttsPerGir, true, "score") },
                  { label: "3パット回避率", value: `${coursePuttingStats.threePuttAvoidance.toFixed(1)}%`, description: "3パット以上にならなかった割合", icon: <PutterIcon className="h-3.5 w-3.5" />, ...courseComp((m) => m.putting.threePuttAvoidance, false, "percent") },
                  { label: "1パット率", value: `${coursePuttingStats.onePuttRate.toFixed(1)}%`, description: "1パットで沈めた割合", icon: <Star className="h-3.5 w-3.5" />, ...courseComp((m) => m.putting.onePuttRate, false, "percent") },
                ]}
              />

              <StatGroupSection
                title="ショット"
                stats={[
                  { label: "パーオン率(FW)", value: `${courseShotStats.girFromFairway.toFixed(1)}%`, description: "フェアウェイからのパーオン率", icon: <Locate className="h-3.5 w-3.5" />, ...courseComp((m) => m.shot.girFromFairway, false, "percent") },
                  { label: "パーオン率(ラフ)", value: `${courseShotStats.girFromRough.toFixed(1)}%`, description: "ラフからのパーオン率", icon: <Trees className="h-3.5 w-3.5" />, ...courseComp((m) => m.shot.girFromRough, false, "percent") },
                ]}
              />
            </CardContent>
          </Card>

          {/* Hole detail analysis */}
          <Card>
            <CardHeader>
              <CardTitle>ホール別詳細分析</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Hole number buttons grouped by sub-course */}
              <div className="space-y-2">
                {/* OUT / first sub-course */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">{subCourseLabels.out}</p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {Array.from({ length: Math.min(9, holeCount) }, (_, i) => i + 1).map((hole) => {
                      const holeScore = allMyScores.find((s) => s.hole_number === hole);
                      return (
                        <button
                          key={hole}
                          onClick={() => setSelectedHole(selectedHole === hole ? null : hole)}
                          className={`flex-shrink-0 w-10 h-10 rounded-lg text-sm font-medium transition-colors flex flex-col items-center justify-center ${
                            selectedHole === hole
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80 text-foreground"
                          }`}
                        >
                          <span>{hole}</span>
                          {holeScore && (
                            <span className="text-[8px] opacity-70">P{holeScore.par}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* IN / second sub-course */}
                {holeCount > 9 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">{subCourseLabels.in}</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {Array.from({ length: Math.min(9, holeCount - 9) }, (_, i) => i + 10).map((hole) => {
                        const holeScore = allMyScores.find((s) => s.hole_number === hole);
                        return (
                          <button
                            key={hole}
                            onClick={() => setSelectedHole(selectedHole === hole ? null : hole)}
                            className={`flex-shrink-0 w-10 h-10 rounded-lg text-sm font-medium transition-colors flex flex-col items-center justify-center ${
                              selectedHole === hole
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80 text-foreground"
                            }`}
                          >
                            <span>{hole}</span>
                            {holeScore && (
                              <span className="text-[8px] opacity-70">P{holeScore.par}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {!selectedHole && (
                <p className="text-center text-muted-foreground py-4">
                  ホール番号を選択してください
                </p>
              )}

              {selectedHole && (
                <div className="space-y-5">
                  {/* Hole header */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">Hole {selectedHole}</span>
                      <span className="px-2 py-0.5 rounded bg-muted text-sm font-medium">
                        Par {selectedHolePar ?? "?"}
                      </span>
                    </div>
                    {selectedHole <= 9 ? (
                      <span className="text-xs text-muted-foreground">{subCourseLabels.out}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{subCourseLabels.in}</span>
                    )}
                    {holeGir && (
                      <span className="text-xs text-muted-foreground ml-auto">{holeGir.count}ラウンド</span>
                    )}
                  </div>

                  {/* Per-hole summary stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {holeGir && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-1.5">
                          <Crosshair className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">パーオン率</p>
                        </div>
                        <p className={`text-lg font-bold mt-0.5 ${
                          holeGir.girRate >= 50 ? "text-green-600" : holeGir.girRate >= 25 ? "text-foreground" : "text-red-500"
                        }`}>{holeGir.girRate.toFixed(0)}%</p>
                      </div>
                    )}
                    {holePutts && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-1.5">
                          <PutterIcon className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">平均パット</p>
                        </div>
                        <p className={`text-lg font-bold mt-0.5 ${
                          holePutts.avgPutts <= 1.8 ? "text-green-600" : holePutts.avgPutts <= 2.1 ? "text-foreground" : "text-red-500"
                        }`}>{holePutts.avgPutts.toFixed(1)}</p>
                      </div>
                    )}
                    {holeScramble && holeScramble.opportunities > 0 && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-1.5">
                          <RotateCcw className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">リカバリー率</p>
                        </div>
                        <p className={`text-lg font-bold mt-0.5 ${
                          holeScramble.scrambleRate >= 50 ? "text-green-600" : holeScramble.scrambleRate >= 25 ? "text-foreground" : "text-red-500"
                        }`}>{holeScramble.scrambleRate.toFixed(0)}%</p>
                      </div>
                    )}
                    {holeScoreDist && holeScoreDist.total > 0 && (() => {
                      const avgOP = holeScorePattern.find((h) => h.hole === selectedHole)?.avgOverPar ?? 0;
                      return (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-1.5">
                            <Flag className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">平均スコア</p>
                          </div>
                          <p className={`text-lg font-bold mt-0.5 ${avgOP <= 0 ? "text-green-600" : avgOP <= 1 ? "text-foreground" : "text-red-500"}`}>
                            {avgOP > 0 ? "+" : ""}{avgOP.toFixed(1)}
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Score distribution full-width bar */}
                  {holeScoreDist && holeScoreDist.total > 0 && (
                    <HoleScoreDistBar dist={holeScoreDist} />
                  )}

                  {/* Tee shot tendency - only for Par 4+ */}
                  {selectedHolePar && selectedHolePar >= 4 && holeTendency && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">ティーショット傾向</h4>
                      <TeeShotTendencyBar tendency={holeTendency} />
                    </div>
                  )}

                  {/* Tee shot clubs */}
                  {hasDetailData && holeTeeShotClubs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">ティーショット番手</h4>
                      <ClubBadgeList clubs={holeTeeShotClubs} />
                    </div>
                  )}

                  {/* Second shot (approach) clubs */}
                  {hasDetailData ? (
                    <div>
                      <h4 className="text-sm font-medium mb-2">セカンド番手</h4>
                      {holeApproachClubs.length > 0 ? (
                        <ClubBadgeList clubs={holeApproachClubs} />
                      ) : (
                        <p className="text-sm text-muted-foreground">データなし</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      詳細データなし（詳細スコア入力で記録してください）
                    </p>
                  )}

                  {/* Pin position heatmap */}
                  {hasPinData && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">ピン位置別 平均スコア</h4>
                      <PinPositionGrid pinScores={holePinScores} />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/** 順位に応じたアクセントカラー */
function getRankColor(rank: number, total: number): { border: string; badge: string } {
  const pct = rank / total;
  if (rank === 1) return { border: "border-l-amber-400", badge: "bg-amber-100 text-amber-700" };
  if (rank === 2) return { border: "border-l-gray-300", badge: "bg-gray-100 text-gray-600" };
  if (rank === 3) return { border: "border-l-orange-300", badge: "bg-orange-50 text-orange-600" };
  if (pct <= 0.33) return { border: "border-l-green-400", badge: "bg-green-50 text-green-700" };
  if (pct <= 0.66) return { border: "border-l-blue-300", badge: "bg-blue-50 text-blue-600" };
  return { border: "border-l-rose-300", badge: "bg-rose-50 text-rose-600" };
}

/** コース概要カード（my-stats共通StatCardのデザインに準拠） */
function CourseOverviewCard({
  label,
  value,
  icon,
  teamVal,
  teamRoundCount,
  format = "score",
  rank = 0,
  totalMembers = 0,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  myVal: number;
  teamVal: number;
  teamRoundCount: number;
  isLowerBetter?: boolean;
  format?: "score" | "percent";
  rank?: number;
  totalMembers?: number;
}) {
  const hasRank = teamRoundCount > 0 && rank > 0 && totalMembers > 0;
  const colors = hasRank ? getRankColor(rank, totalMembers) : null;

  return (
    <div className={`p-4 rounded-lg border-l-[3px] bg-muted/50 ${
      colors ? colors.border : "border-l-transparent"
    }`}>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground flex-shrink-0">{icon}</span>
        <p className="text-sm text-muted-foreground truncate">{label}</p>
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hasRank && colors && (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              部平均 {format === "percent" ? `${teamVal.toFixed(1)}%` : teamVal.toFixed(1)}
            </span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${colors.badge}`}>
              {rank}位/{totalMembers}人
            </span>
          </div>
          <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all"
              style={{
                width: `${Math.max(8, ((totalMembers - rank + 1) / totalMembers) * 100)}%`,
                backgroundColor:
                  rank <= 3
                    ? rank === 1 ? "#f59e0b" : rank === 2 ? "#9ca3af" : "#f97316"
                    : rank / totalMembers <= 0.33
                      ? "#22c55e"
                      : rank / totalMembers <= 0.66
                        ? "#3b82f6"
                        : "#f43f5e",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** クラブ使用バッジリスト */
function ClubBadgeList({ clubs }: { clubs: { club: string; count: number }[] }) {
  const maxCount = Math.max(...clubs.map((c) => c.count));
  return (
    <div className="flex flex-wrap gap-2">
      {clubs.map((c) => (
        <span
          key={c.club}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm ${
            c.count === maxCount ? "bg-primary/10 text-primary font-semibold" : "bg-muted"
          }`}
        >
          <span className="font-medium">{c.club}</span>
          <span className="text-muted-foreground text-xs">{c.count}回</span>
        </span>
      ))}
    </div>
  );
}

/** ホール別スコア分布バー（横長・ラベル付き） */
function HoleScoreDistBar({ dist }: { dist: { eagle: number; birdie: number; par: number; bogey: number; doublePlus: number; total: number } }) {
  if (dist.total === 0) return null;
  const items = [
    { key: "eagle", count: dist.eagle, color: "#16a34a", label: "イーグル" },
    { key: "birdie", count: dist.birdie, color: "#22c55e", label: "バーディー" },
    { key: "par", count: dist.par, color: "#3b82f6", label: "パー" },
    { key: "bogey", count: dist.bogey, color: "#f59e0b", label: "ボギー" },
    { key: "double", count: dist.doublePlus, color: "#ef4444", label: "ダボ+" },
  ].filter((i) => i.count > 0);

  return (
    <div className="space-y-1.5">
      <h4 className="text-sm font-medium">スコア分布</h4>
      <div className="flex h-7 rounded-md overflow-hidden">
        {items.map((item) => {
          const pct = (item.count / dist.total) * 100;
          return (
            <div
              key={item.key}
              className="flex items-center justify-center text-xs text-white font-medium"
              style={{ width: `${pct}%`, backgroundColor: item.color, minWidth: pct > 0 ? 4 : 0 }}
            >
              {pct >= 18 && `${pct.toFixed(0)}%`}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        {items.map((item) => (
          <span key={item.key} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: item.color }} />
            {item.label} {item.count}回
          </span>
        ))}
      </div>
    </div>
  );
}

function TeeShotTendencyBar({ tendency }: { tendency: { left: number; center: number; right: number } }) {
  const total = tendency.left + tendency.center + tendency.right;
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">データなし</p>;
  }

  const leftPct = (tendency.left / total) * 100;
  const centerPct = (tendency.center / total) * 100;
  const rightPct = (tendency.right / total) * 100;

  return (
    <div className="space-y-1">
      <div className="flex h-6 rounded-md overflow-hidden">
        {leftPct > 0 && (
          <div
            className="bg-red-400 flex items-center justify-center text-xs text-white"
            style={{ width: `${leftPct}%` }}
          >
            {leftPct >= 15 && `${leftPct.toFixed(0)}%`}
          </div>
        )}
        {centerPct > 0 && (
          <div
            className="bg-green-500 flex items-center justify-center text-xs text-white"
            style={{ width: `${centerPct}%` }}
          >
            {centerPct >= 15 && `${centerPct.toFixed(0)}%`}
          </div>
        )}
        {rightPct > 0 && (
          <div
            className="bg-blue-400 flex items-center justify-center text-xs text-white"
            style={{ width: `${rightPct}%` }}
          >
            {rightPct >= 15 && `${rightPct.toFixed(0)}%`}
          </div>
        )}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>左 {tendency.left}回</span>
        <span>中央 {tendency.center}回</span>
        <span>右 {tendency.right}回</span>
      </div>
    </div>
  );
}

function PinPositionGrid({ pinScores }: { pinScores: { position: string; avgOverPar: number; count: number }[] }) {
  const scoreMap = new Map(pinScores.map((p) => [p.position, p]));

  return (
    <div className="grid grid-cols-3 gap-1 max-w-[200px]">
      {PIN_POSITIONS.map((pos) => {
        const data = scoreMap.get(pos.key);
        const avgOverPar = data ? data.avgOverPar : null;
        const colorClass = getPinColor(avgOverPar);

        return (
          <div
            key={pos.key}
            className={`aspect-square rounded flex flex-col items-center justify-center text-xs ${colorClass}`}
          >
            <span className="font-medium">{pos.label}</span>
            {data && (
              <span className="text-[10px]">
                {avgOverPar! > 0 ? "+" : ""}
                {avgOverPar!.toFixed(1)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
