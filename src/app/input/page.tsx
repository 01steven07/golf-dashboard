"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Loader2, ClipboardEdit, Search } from "lucide-react";
import Link from "next/link";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { OcrResult, OcrScoreData } from "@/types/ocr";
import { Course, FairwayResult } from "@/types/database";
import { cn } from "@/lib/utils";

type Step = "upload" | "processing" | "confirm";

export default function InputPage() {
  return (
    <RequireAuth>
      <InputContent />
    </RequireAuth>
  );
}

function InputContent() {
  const router = useRouter();
  const { member } = useAuth();
  const [step, setStep] = useState<Step>("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [newCourseName, setNewCourseName] = useState<string>("");
  const [roundDate, setRoundDate] = useState<string>("");
  const [teeColor, setTeeColor] = useState<string>("White");
  const [scores, setScores] = useState<OcrScoreData[]>([]);
  const [error, setError] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState<string>("");

  const handleFileSelect = useCallback(async (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setStep("processing");
    setError("");

    // Fetch courses
    const { data: coursesData } = await supabase
      .from("courses")
      .select("*")
      .order("name");
    setCourses(coursesData ?? []);

    // Call OCR API
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "OCR処理に失敗しました");
      }

      const result: OcrResult = await res.json();
      setOcrResult(result);
      setScores(result.scores);
      setRoundDate(result.date || new Date().toISOString().split("T")[0]);
      setTeeColor(result.tee_color || "White");

      // Try to match course name
      const matchedCourse = coursesData?.find(
        (c) => c.name.toLowerCase() === result.course_name.toLowerCase()
      );
      if (matchedCourse) {
        setSelectedCourseId(matchedCourse.id);
      } else {
        setNewCourseName(result.course_name);
      }

      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setStep("upload");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const updateScore = (index: number, field: keyof OcrScoreData, value: number | FairwayResult | null) => {
    setScores((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!member) return;
    setError("");
    setIsSaving(true);

    try {
      let courseId = selectedCourseId;

      // Create new course if needed
      if (!courseId && newCourseName) {
        const { data: newCourse, error: courseError } = await supabase
          .from("courses")
          .insert({ name: newCourseName })
          .select()
          .single();

        if (courseError) throw courseError;
        courseId = newCourse.id;
      }

      if (!courseId) {
        setError("コースを選択または入力してください");
        setIsSaving(false);
        return;
      }

      // Upload image to Supabase Storage (optional)
      let imageUrl: string | null = null;
      if (imageFile) {
        const fileName = `${member.id}/${Date.now()}_${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("scorecards")
          .upload(fileName, imageFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("scorecards")
            .getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      }

      // Create round
      const { data: round, error: roundError } = await supabase
        .from("rounds")
        .insert({
          member_id: member.id,
          course_id: courseId,
          date: roundDate,
          tee_color: teeColor,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (roundError) throw roundError;

      // Create scores
      const scoreRecords = scores.map((s) => ({
        round_id: round.id,
        hole_number: s.hole_number,
        par: s.par,
        distance: s.distance,
        score: s.score,
        putts: s.putts,
        fairway_result: s.fairway_result,
        ob: s.ob,
        bunker: s.bunker,
        penalty: s.penalty,
      }));

      const { error: scoresError } = await supabase.from("scores").insert(scoreRecords);

      if (scoresError) throw scoresError;

      router.push("/my-stats");
    } catch (err) {
      console.error(err);
      setError("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const totalPar = scores.reduce((sum, s) => sum + s.par, 0);

  // 検索とグルーピング
  const groupedCourses = useMemo(() => {
    // 検索フィルタリング
    const filtered = courses.filter((course) =>
      course.name.toLowerCase().includes(courseSearchQuery.toLowerCase())
    );

    // 都道府県別にグルーピング
    const grouped = new Map<string, Course[]>();
    filtered.forEach((course) => {
      const pref = course.pref || "その他";
      if (!grouped.has(pref)) {
        grouped.set(pref, []);
      }
      grouped.get(pref)!.push(course);
    });

    // ソート: 都道府県名でソート
    return Array.from(grouped.entries()).sort(([a], [b]) => {
      if (a === "その他") return 1;
      if (b === "その他") return -1;
      return a.localeCompare(b, "ja");
    });
  }, [courses, courseSearchQuery]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">スコア入力</h2>

      {/* 入力方法の選択 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <Camera className="h-6 w-6 text-green-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">OCR自動入力</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  スコアカードの写真から自動でスコアを読み取り
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/input/detailed">
          <Card className="border-2 border-blue-200 bg-blue-50/50 hover:border-blue-400 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <ClipboardEdit className="h-6 w-6 text-blue-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800">詳細ショット入力</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    全ショットを手動で詳細に記録
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              スコアカード画像アップロード
            </CardTitle>
          </CardHeader>
          <CardContent>
            <label
              className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-12 text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="h-10 w-10 mb-4" />
              <p>ここに画像をドロップ、またはタップして選択</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInputChange}
              />
            </label>
            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      {step === "processing" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">スコアカードを解析中...</p>
          </CardContent>
        </Card>
      )}

      {step === "confirm" && ocrResult && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>ラウンド情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>コース</Label>

                  {/* 検索入力 */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      value={courseSearchQuery}
                      onChange={(e) => setCourseSearchQuery(e.target.value)}
                      placeholder="コース名で検索..."
                      className="pl-9"
                    />
                  </div>

                  {/* コース選択 */}
                  <div className="max-h-64 overflow-y-auto border rounded-md bg-white">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCourseId("");
                        setCourseSearchQuery("");
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors border-b",
                        !selectedCourseId
                          ? "bg-green-100 text-green-800 font-medium"
                          : "text-gray-700"
                      )}
                    >
                      新規コースを入力
                    </button>

                    {groupedCourses.length === 0 && courseSearchQuery ? (
                      <div className="p-3 text-sm text-gray-400 text-center">
                        該当するコースがありません
                      </div>
                    ) : (
                      groupedCourses.map(([pref, prefCourses]) => (
                        <div key={pref} className="border-b last:border-b-0">
                          <div className="px-3 py-1.5 bg-gray-50 text-xs font-semibold text-gray-600 sticky top-0">
                            {pref}
                          </div>
                          <div>
                            {prefCourses.map((course) => (
                              <button
                                key={course.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCourseId(course.id);
                                  setNewCourseName("");
                                }}
                                className={cn(
                                  "w-full px-3 py-2 text-left text-sm hover:bg-green-50 transition-colors",
                                  selectedCourseId === course.id
                                    ? "bg-green-100 text-green-800 font-medium"
                                    : "text-gray-700"
                                )}
                              >
                                {course.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {!selectedCourseId && (
                    <Input
                      placeholder="新規コース名を入力"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>日付</Label>
                  <Input
                    type="date"
                    value={roundDate}
                    onChange={(e) => setRoundDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ティー</Label>
                  <select
                    value={teeColor}
                    onChange={(e) => setTeeColor(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Blue">Blue</option>
                    <option value="White">White</option>
                    <option value="Red">Red</option>
                    <option value="Gold">Gold</option>
                    <option value="Black">Black</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>スコア詳細</span>
                <span className="text-lg">
                  {totalScore} ({totalScore - totalPar >= 0 ? "+" : ""}
                  {totalScore - totalPar})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-1 text-left">Hole</th>
                      <th className="py-2 px-1 text-center">Par</th>
                      <th className="py-2 px-1 text-center">Dist</th>
                      <th className="py-2 px-1 text-center">Score</th>
                      <th className="py-2 px-1 text-center">Putt</th>
                      <th className="py-2 px-1 text-center">FW</th>
                      <th className="py-2 px-1 text-center">OB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((s, i) => (
                      <tr key={s.hole_number} className="border-b">
                        <td className="py-2 px-1 font-medium">{s.hole_number}</td>
                        <td className="py-2 px-1">
                          <select
                            value={s.par}
                            onChange={(e) => updateScore(i, "par", Number(e.target.value) as 3 | 4 | 5)}
                            className="w-14 h-8 rounded border text-center"
                          >
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                          </select>
                        </td>
                        <td className="py-2 px-1">
                          <Input
                            type="number"
                            min={1}
                            max={700}
                            value={s.distance ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateScore(i, "distance", val ? Number(val) : null);
                            }}
                            placeholder="-"
                            className="w-16 h-8 text-center"
                          />
                        </td>
                        <td className="py-2 px-1">
                          <Input
                            type="number"
                            min={1}
                            max={15}
                            value={s.score}
                            onChange={(e) => updateScore(i, "score", Number(e.target.value))}
                            className="w-14 h-8 text-center"
                          />
                        </td>
                        <td className="py-2 px-1">
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            value={s.putts}
                            onChange={(e) => updateScore(i, "putts", Number(e.target.value))}
                            className="w-14 h-8 text-center"
                          />
                        </td>
                        <td className="py-2 px-1">
                          <select
                            value={s.fairway_result}
                            onChange={(e) => updateScore(i, "fairway_result", e.target.value as FairwayResult)}
                            className="w-16 h-8 rounded border text-center text-xs"
                          >
                            <option value="keep">Keep</option>
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                          </select>
                        </td>
                        <td className="py-2 px-1">
                          <Input
                            type="number"
                            min={0}
                            max={5}
                            value={s.ob}
                            onChange={(e) => updateScore(i, "ob", Number(e.target.value))}
                            className="w-14 h-8 text-center"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setStep("upload");
                setImageFile(null);
                setImagePreview(null);
                setOcrResult(null);
              }}
            >
              やり直す
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存する"
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
