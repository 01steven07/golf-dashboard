"use client";

import { useState, useEffect, useMemo } from "react";
import { CourseWithDetails } from "@/types/database";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  // 検索とグルーピング
  const groupedCourses = useMemo(() => {
    // 検索フィルタリング
    const filtered = courses.filter((course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 都道府県別にグルーピング
    const grouped = new Map<string, CourseWithDetails[]>();
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
  }, [courses, searchQuery]);

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
        <div className="space-y-2">
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
            <>
              {/* 検索入力 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="コース名で検索..."
                  className="h-9 text-sm pl-9"
                />
              </div>

              {/* コース選択 */}
              <div className="max-h-64 overflow-y-auto border rounded-md bg-white">
                {groupedCourses.length === 0 ? (
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
                            onClick={() => handleCourseChange(course.id)}
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
            </>
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
