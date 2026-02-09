"use client";

import { useRouter } from "next/navigation";
import { DetailedRoundData } from "@/types/shot";
import { CourseWithDetails } from "@/types/database";
import { CourseSelector } from "@/components/course/course-selector";
import { SubCourseSelector } from "@/components/course/sub-course-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StepSettingsProps {
  roundData: DetailedRoundData;
  selectedCourse: CourseWithDetails | null;
  onCourseSelect: (course: CourseWithDetails | null) => void;
  onManualInput: (name: string) => void;
  onSubCourseToggle: (subCourseId: string) => void;
  onSubCourseReorder: (reorderedIds: string[]) => void;
  onTeeSelect: (teeId: string) => void;
  onDateChange: (date: string) => void;
  onTeeColorChange: (color: string) => void;
  onStartScoring: () => void;
}

export function StepSettings({
  roundData,
  selectedCourse,
  onCourseSelect,
  onManualInput,
  onSubCourseToggle,
  onSubCourseReorder,
  onTeeSelect,
  onDateChange,
  onTeeColorChange,
  onStartScoring,
}: StepSettingsProps) {
  const router = useRouter();

  const canStart = roundData.courseName.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-gray-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-green-800">詳細入力</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* コース選択 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">コース設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CourseSelector
              onCourseSelect={onCourseSelect}
              onManualInput={onManualInput}
              courseName={roundData.courseName}
            />

            {/* コース選択時: サブコース＋ティー選択 */}
            {selectedCourse && selectedCourse.sub_courses.length > 0 && (
              <SubCourseSelector
                subCourses={selectedCourse.sub_courses}
                tees={selectedCourse.tees}
                selectedSubCourseIds={roundData.subCourseIds}
                selectedTeeId={roundData.teeId}
                onSubCourseToggle={onSubCourseToggle}
                onSubCourseReorder={onSubCourseReorder}
                onTeeSelect={onTeeSelect}
              />
            )}

            {/* 手動入力時: ティー色選択 */}
            {!selectedCourse && (
              <div>
                <Label className="text-xs text-gray-500">ティー</Label>
                <div className="flex gap-1 mt-1 overflow-x-auto pb-1">
                  {["Back", "Regular", "White", "Gold", "Red"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onTeeColorChange(color)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                        roundData.teeColor === color
                          ? "bg-green-600 text-white"
                          : "bg-white text-gray-600 border"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 日付 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ラウンド日</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={roundData.date}
              onChange={(e) => onDateChange(e.target.value)}
              className="h-10 text-sm"
            />
          </CardContent>
        </Card>

        {/* ホール数サマリー */}
        <Card>
          <CardContent className="py-4">
            <div className="text-center text-sm text-gray-600">
              <span className="font-bold text-green-700 text-lg">
                {roundData.holes.length}
              </span>
              ホール のスコアを入力します
            </div>
          </CardContent>
        </Card>

        {/* スコア入力開始ボタン */}
        <Button
          onClick={onStartScoring}
          disabled={!canStart}
          className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
        >
          スコア入力を開始
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
