"use client";

import { SubCourseWithHoles, CourseTee } from "@/types/database";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface SubCourseSelectorProps {
  subCourses: SubCourseWithHoles[];
  tees: CourseTee[];
  selectedSubCourseIds: string[];
  selectedTeeId: string | null;
  onSubCourseToggle: (subCourseId: string) => void;
  onSubCourseReorder: (reorderedIds: string[]) => void;
  onTeeSelect: (teeId: string) => void;
}

export function SubCourseSelector({
  subCourses,
  tees,
  selectedSubCourseIds,
  selectedTeeId,
  onSubCourseToggle,
  onSubCourseReorder,
  onTeeSelect,
}: SubCourseSelectorProps) {
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newIds = [...selectedSubCourseIds];
    [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
    onSubCourseReorder(newIds);
  };

  const moveDown = (index: number) => {
    if (index >= selectedSubCourseIds.length - 1) return;
    const newIds = [...selectedSubCourseIds];
    [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
    onSubCourseReorder(newIds);
  };

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

      {/* スタート順 */}
      {selectedSubCourseIds.length >= 2 && (
        <div>
          <Label className="text-xs text-gray-500">スタート順</Label>
          <div className="mt-1 space-y-1">
            {selectedSubCourseIds.map((id, idx) => {
              const sc = subCourses.find((s) => s.id === id);
              if (!sc) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5"
                >
                  <span className="text-xs font-bold text-green-700 w-4">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm">{sc.name}</span>
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className={cn(
                      "p-1 rounded",
                      idx === 0
                        ? "text-gray-300"
                        : "text-gray-500 hover:bg-gray-200"
                    )}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={idx === selectedSubCourseIds.length - 1}
                    className={cn(
                      "p-1 rounded",
                      idx === selectedSubCourseIds.length - 1
                        ? "text-gray-300"
                        : "text-gray-500 hover:bg-gray-200"
                    )}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
