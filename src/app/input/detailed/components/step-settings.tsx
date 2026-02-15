"use client";

import { useRouter } from "next/navigation";
import { DetailedRoundData, OptionalFieldSettings } from "@/types/shot";
import { CourseWithDetails } from "@/types/database";
import { Checkbox } from "@/components/ui/checkbox";
import { CourseSelector } from "@/components/course/course-selector";
import { SubCourseSelector } from "@/components/course/sub-course-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, RotateCcw, PlayCircle } from "lucide-react";

interface StepSettingsProps {
  roundData: DetailedRoundData;
  selectedCourse: CourseWithDetails | null;
  draftInfo: { courseName: string; date: string } | null;
  optionalFields: OptionalFieldSettings;
  onOptionalFieldsChange: (fields: OptionalFieldSettings) => void;
  onCourseSelect: (course: CourseWithDetails | null) => void;
  onManualInput: (name: string) => void;
  onSubCourseAdd: (subCourseId: string) => void;
  onSubCourseRemove: (index: number) => void;
  onSubCourseReorder: (reorderedIds: string[]) => void;
  onTeeSelect: (teeId: string) => void;
  onDateChange: (date: string) => void;
  onTeeColorChange: (color: string) => void;
  onStartScoring: () => void;
  onResumeDraft: () => void;
  onDiscardDraft: () => void;
}

const OPTIONAL_FIELD_OPTIONS: { key: keyof OptionalFieldSettings; label: string; description: string }[] = [
  { key: "pinPosition", label: "ピン位置", description: "各ホールのピン位置（9分割）" },
  { key: "wind", label: "風向き", description: "ティーショット・アプローチの風向き" },
  { key: "shotDistance", label: "ショットの残り距離", description: "アプローチの残り距離（yd）" },
  { key: "puttDistance", label: "パットの残り距離", description: "パットの距離（m）" },
  { key: "shotLieSlope", label: "ライ・傾斜", description: "アプローチのライと傾斜" },
  { key: "shotResultDirection", label: "ショットの結果方向", description: "グリーンON/外し等の細分方向" },
  { key: "puttLine", label: "パットのライン", description: "傾斜と曲がりの組み合わせ" },
];

export function StepSettings({
  roundData,
  selectedCourse,
  draftInfo,
  optionalFields,
  onOptionalFieldsChange,
  onCourseSelect,
  onManualInput,
  onSubCourseAdd,
  onSubCourseRemove,
  onSubCourseReorder,
  onTeeSelect,
  onDateChange,
  onTeeColorChange,
  onStartScoring,
  onResumeDraft,
  onDiscardDraft,
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
        {/* ドラフト復元バナー */}
        {draftInfo && (
          <Card className="border-2 border-amber-300 bg-amber-50">
            <CardContent className="p-4">
              <p className="text-sm text-amber-800 font-medium mb-1">
                中断中の入力データがあります
              </p>
              <p className="text-xs text-amber-700 mb-3">
                {draftInfo.courseName || "コース未設定"} / {draftInfo.date}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={onResumeDraft}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  size="sm"
                >
                  <PlayCircle className="w-4 h-4 mr-1" />
                  再開する
                </Button>
                <Button
                  variant="outline"
                  onClick={onDiscardDraft}
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  破棄
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                onSubCourseAdd={onSubCourseAdd}
                onSubCourseRemove={onSubCourseRemove}
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

        {/* 入力項目設定 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">入力項目</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-500">表示する任意項目を選択してください</p>
            {OPTIONAL_FIELD_OPTIONS.map((opt) => (
              <label
                key={opt.key}
                className="flex items-start gap-3 cursor-pointer"
              >
                <Checkbox
                  checked={optionalFields[opt.key]}
                  onCheckedChange={(checked) =>
                    onOptionalFieldsChange({
                      ...optionalFields,
                      [opt.key]: !!checked,
                    })
                  }
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.description}</div>
                </div>
              </label>
            ))}
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
