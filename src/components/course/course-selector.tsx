"use client";

import { useState, useEffect } from "react";
import { CourseWithDetails } from "@/types/database";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CourseSelectorProps {
  onCourseSelect: (course: CourseWithDetails | null) => void;
  onManualInput: (name: string) => void;
  courseName: string;
}

export function CourseSelector({
  onCourseSelect,
  onManualInput,
  courseName,
}: CourseSelectorProps) {
  const [courses, setCourses] = useState<CourseWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<"select" | "manual">("select");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/courses?detailed=true");
        if (res.ok) {
          const data = await res.json();
          setCourses(data);
        }
      } catch {
        console.error("コース一覧の取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    if (!courseId) {
      onCourseSelect(null);
      return;
    }
    const course = courses.find((c) => c.id === courseId);
    if (course) {
      onCourseSelect(course);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => {
            setMode("select");
            setSelectedCourseId("");
            onCourseSelect(null);
          }}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
            mode === "select"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600"
          )}
        >
          登録済み
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("manual");
            setSelectedCourseId("");
            onCourseSelect(null);
          }}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
            mode === "manual"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600"
          )}
        >
          手動入力
        </button>
      </div>

      {mode === "select" ? (
        <div>
          <Label className="text-xs text-gray-500">コース</Label>
          {isLoading ? (
            <div className="h-9 flex items-center text-sm text-gray-400">
              読み込み中...
            </div>
          ) : courses.length === 0 ? (
            <div className="text-sm text-gray-400">
              登録済みコースがありません
            </div>
          ) : (
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">コースを選択</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.pref ? ` (${c.pref})` : ""}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : (
        <div>
          <Label className="text-xs text-gray-500">コース名</Label>
          <Input
            value={courseName}
            onChange={(e) => onManualInput(e.target.value)}
            placeholder="コース名を入力"
            className="h-9 text-sm"
          />
        </div>
      )}
    </div>
  );
}
