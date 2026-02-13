"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Course } from "@/types/database";
import { Plus, Pencil, Trash2, Loader2, MapPin, Search } from "lucide-react";
import { authFetch } from "@/lib/api-client";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses");
      if (res.ok) {
        setCourses(await res.json());
      }
    } catch {
      console.error("コース一覧の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // 検索とグルーピング
  const groupedCourses = useMemo(() => {
    const filtered = courses.filter((course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const grouped = new Map<string, Course[]>();
    filtered.forEach((course) => {
      const pref = course.pref || "その他";
      if (!grouped.has(pref)) {
        grouped.set(pref, []);
      }
      grouped.get(pref)!.push(course);
    });

    return Array.from(grouped.entries()).sort(([a], [b]) => {
      if (a === "その他") return 1;
      if (b === "その他") return -1;
      return a.localeCompare(b, "ja");
    });
  }, [courses, searchQuery]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;

    setDeletingId(id);
    try {
      const res = await authFetch(`/api/courses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCourses(courses.filter((c) => c.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "削除に失敗しました");
      }
    } catch {
      alert("削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">コース管理</h2>
          <p className="text-sm text-muted-foreground">
            ゴルフ場のコース情報を管理します
          </p>
        </div>
        <Link href="/courses/new">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            新規登録
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            コースが登録されていません
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 検索ボックス */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="コース名で検索..."
              className="pl-9"
            />
          </div>

          {groupedCourses.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              該当するコースがありません
            </div>
          ) : (
            <div className="space-y-6">
              {groupedCourses.map(([pref, prefCourses]) => (
                <div key={pref}>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">
                    {pref}
                  </h3>
                  <div className="space-y-3">
                    {prefCourses.map((course) => (
                      <Card key={course.id}>
                        <CardContent className="flex items-center justify-between py-4">
                          <div>
                            <div className="font-medium">{course.name}</div>
                            {course.pref && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {course.pref}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/courses/${course.id}/edit`}>
                              <Button variant="outline" size="sm">
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(course.id, course.name)}
                              disabled={deletingId === course.id}
                            >
                              {deletingId === course.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 text-red-500" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
