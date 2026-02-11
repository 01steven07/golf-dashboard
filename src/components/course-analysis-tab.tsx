"use client";

import { useEffect, useState, useMemo } from "react";
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
  calculatePinPositionScores,
  CourseBasicStats,
} from "@/utils/course-stats";
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
import { Loader2 } from "lucide-react";

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
  scores: ScoreRow[];
}

interface CourseAnalysisTabProps {
  memberId: string;
}

const PIE_COLORS = {
  eagle: "#16a34a",
  birdie: "#22c55e",
  par: "#3b82f6",
  bogey: "#f59e0b",
  doublePlus: "#ef4444",
};

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
  const [teamRounds, setTeamRounds] = useState<{ scores: ScoreRow[] }[]>([]);
  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Fetch played courses
  useEffect(() => {
    async function fetchCourses() {
      const { data, error } = await supabase
        .from("rounds")
        .select("course_id, courses!inner(id, name, pref)")
        .eq("member_id", memberId)
        .not("course_id", "is", null);

      if (error) {
        console.error("Failed to fetch courses:", error);
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
    }

    fetchCourses();
  }, [memberId]);

  // Fetch data when course is selected
  useEffect(() => {
    if (!selectedCourseId) return;

    async function fetchCourseData() {
      setIsLoadingData(true);
      setSelectedHole(null);

      const [myResult, teamResult] = await Promise.all([
        supabase
          .from("rounds")
          .select("id, date, scores(hole_number, par, score, putts, fairway_result, pin_position, shots_detail)")
          .eq("member_id", memberId)
          .eq("course_id", selectedCourseId)
          .order("date", { ascending: false }),
        supabase
          .from("rounds")
          .select("id, member_id, scores(hole_number, par, score, putts, fairway_result)")
          .eq("course_id", selectedCourseId)
          .order("date", { ascending: false }),
      ]);

      if (myResult.error) {
        console.error("Failed to fetch my rounds:", myResult.error);
      } else {
        setMyRounds(
          (myResult.data ?? []).map((r) => ({
            id: r.id,
            date: r.date,
            scores: (r.scores as ScoreRow[]) ?? [],
          }))
        );
      }

      if (teamResult.error) {
        console.error("Failed to fetch team rounds:", teamResult.error);
      } else {
        setTeamRounds(
          (teamResult.data ?? []).map((r) => ({
            scores: (r.scores as unknown as ScoreRow[]) ?? [],
          }))
        );
      }

      setIsLoadingData(false);
    }

    fetchCourseData();
  }, [memberId, selectedCourseId]);

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
              <StatCard
                label="平均スコア"
                value={myBasicStats.avgScore.toFixed(1)}
                myStats={myBasicStats}
                teamStats={teamBasicStats}
                statKey="avgScore"
              />
              <StatCard
                label="平均パット"
                value={myBasicStats.avgPutts.toFixed(1)}
                myStats={myBasicStats}
                teamStats={teamBasicStats}
                statKey="avgPutts"
              />
              <StatCard
                label="GIR率"
                value={`${myBasicStats.girRate.toFixed(1)}%`}
                myStats={myBasicStats}
                teamStats={teamBasicStats}
                statKey="girRate"
              />
              <StatCard
                label="FWキープ率"
                value={`${myBasicStats.fairwayKeepRate.toFixed(1)}%`}
                myStats={myBasicStats}
                teamStats={teamBasicStats}
                statKey="fairwayKeepRate"
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

          {/* Hole detail analysis */}
          <Card>
            <CardHeader>
              <CardTitle>ホール別詳細分析</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Hole number buttons */}
              <div className="flex gap-1.5 overflow-x-auto pb-2">
                {Array.from({ length: holeCount }, (_, i) => i + 1).map((hole) => (
                  <button
                    key={hole}
                    onClick={() => setSelectedHole(selectedHole === hole ? null : hole)}
                    className={`flex-shrink-0 w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                      selectedHole === hole
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    {hole}
                  </button>
                ))}
              </div>

              {!selectedHole && (
                <p className="text-center text-muted-foreground py-4">
                  ホール番号を選択してください
                </p>
              )}

              {selectedHole && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Hole {selectedHole} (Par {selectedHolePar ?? "?"})
                  </p>

                  {/* Tee shot tendency - only for Par 4+ */}
                  {selectedHolePar && selectedHolePar >= 4 && holeTendency && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">ティーショット傾向</h4>
                      <TeeShotTendencyBar tendency={holeTendency} />
                    </div>
                  )}

                  {/* Approach clubs */}
                  {hasDetailData ? (
                    <div>
                      <h4 className="text-sm font-medium mb-2">アプローチ番手</h4>
                      {holeApproachClubs.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {holeApproachClubs.map((c) => (
                            <span
                              key={c.club}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-sm"
                            >
                              <span className="font-medium">{c.club}</span>
                              <span className="text-muted-foreground">{c.count}回</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">アプローチデータなし</p>
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

function StatCard({
  label,
  value,
  myStats,
  teamStats,
  statKey,
}: {
  label: string;
  value: string;
  myStats: CourseBasicStats;
  teamStats: CourseBasicStats;
  statKey: keyof CourseBasicStats;
}) {
  const myVal = myStats[statKey] as number;
  const teamVal = teamStats[statKey] as number;
  const diff = myVal - teamVal;
  const isLowerBetter = statKey === "avgScore" || statKey === "avgPutts";
  const isGood = isLowerBetter ? diff < 0 : diff > 0;

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {teamStats.roundCount > 0 && (
          <p className={`text-xs mt-1 ${isGood ? "text-green-600" : "text-red-500"}`}>
            vs チーム: {diff > 0 ? "+" : ""}
            {statKey === "girRate" || statKey === "fairwayKeepRate"
              ? diff.toFixed(1) + "%"
              : diff.toFixed(1)}
          </p>
        )}
      </CardContent>
    </Card>
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
