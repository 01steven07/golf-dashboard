"use client";

import { CourseForm } from "@/components/course/course-form";

export default function NewCoursePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">コース新規登録</h2>
        <p className="text-sm text-muted-foreground">
          ゴルフ場のコース情報を登録します
        </p>
      </div>
      <CourseForm />
    </div>
  );
}
