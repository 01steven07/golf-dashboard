"use client";

import { useState, useEffect, use } from "react";
import { CourseForm } from "@/components/course/course-form";
import { CourseFormData } from "@/types/course";
import { CourseWithDetails } from "@/types/database";
import { Loader2 } from "lucide-react";

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [formData, setFormData] = useState<CourseFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/courses/${id}`);
        if (!res.ok) {
          setError("コースが見つかりません");
          return;
        }

        const course: CourseWithDetails = await res.json();

        setFormData({
          name: course.name,
          pref: course.pref || "",
          source_url: course.source_url || "",
          green_types: course.green_types || [],
          tees: course.tees.map((t) => ({
            id: t.id,
            name: t.name,
            color: t.color || "",
            sort_order: t.sort_order,
          })),
          sub_courses: course.sub_courses.map((sc) => ({
            id: sc.id,
            name: sc.name,
            hole_count: sc.hole_count,
            sort_order: sc.sort_order,
            holes: sc.holes.map((h) => ({
              id: h.id,
              hole_number: h.hole_number,
              par: h.par,
              handicap: h.handicap,
              distances: h.distances,
            })),
          })),
        });
      } catch {
        setError("コース情報の取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="text-center py-12 text-red-500">
        {error || "エラーが発生しました"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">コース編集</h2>
        <p className="text-sm text-muted-foreground">
          コース情報を編集します
        </p>
      </div>
      <CourseForm initialData={formData} courseId={id} />
    </div>
  );
}
