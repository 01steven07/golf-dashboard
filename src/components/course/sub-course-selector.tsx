"use client";

import { SubCourseWithHoles, CourseTee } from "@/types/database";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SubCourseSelectorProps {
  subCourses: SubCourseWithHoles[];
  tees: CourseTee[];
  selectedSubCourseIds: string[];
  selectedTeeId: string | null;
  onSubCourseToggle: (subCourseId: string) => void;
  onTeeSelect: (teeId: string) => void;
}

export function SubCourseSelector({
  subCourses,
  tees,
  selectedSubCourseIds,
  selectedTeeId,
  onSubCourseToggle,
  onTeeSelect,
}: SubCourseSelectorProps) {
  return (
    <div className="space-y-3">
      {/* サブコース選択 */}
      <div>
        <Label className="text-xs text-gray-500">コース選択</Label>
        <div className="flex gap-1 mt-1 flex-wrap">
          {subCourses.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => onSubCourseToggle(sc.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                selectedSubCourseIds.includes(sc.id)
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {sc.name} ({sc.hole_count}H)
            </button>
          ))}
        </div>
      </div>

      {/* ティー選択 */}
      {tees.length > 0 && (
        <div>
          <Label className="text-xs text-gray-500">ティー</Label>
          <div className="flex gap-1 mt-1 flex-wrap">
            {tees.map((tee) => (
              <button
                key={tee.id}
                type="button"
                onClick={() => onTeeSelect(tee.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  selectedTeeId === tee.id
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {tee.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
