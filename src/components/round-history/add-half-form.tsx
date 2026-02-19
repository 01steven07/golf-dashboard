"use client";

import { useState } from "react";
import { FairwayResult } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, X, Loader2 } from "lucide-react";

export interface HoleInput {
  par: number;
  score: number;
  putts: number;
  fairway_result: FairwayResult;
  ob: number;
  bunker: number;
  penalty: number;
  distance: number | null;
}

interface AddHalfFormProps {
  startHoleNumber: number;
  subCourseNames: string[];
  onSubmit: (scores: HoleInput[], courseLabel: string) => Promise<void>;
  onCancel: () => void;
}

const PAR_OPTIONS = [3, 4, 5] as const;

const FW_OPTIONS: { value: FairwayResult; label: string }[] = [
  { value: "keep", label: "○" },
  { value: "left", label: "←" },
  { value: "right", label: "→" },
];

function createDefaultHole(): HoleInput {
  return {
    par: 4,
    score: 4,
    putts: 2,
    fairway_result: "keep",
    ob: 0,
    bunker: 0,
    penalty: 0,
    distance: null,
  };
}

export function AddHalfForm({
  startHoleNumber,
  subCourseNames,
  onSubmit,
  onCancel,
}: AddHalfFormProps) {
  const [courseLabel, setCourseLabel] = useState<string>(
    subCourseNames.length > 0 ? subCourseNames[0] : ""
  );
  const [holes, setHoles] = useState<HoleInput[]>(() =>
    Array.from({ length: 9 }, () => createDefaultHole())
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateHole = (
    index: number,
    field: keyof HoleInput,
    value: number | string | null
  ) => {
    setHoles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const validate = (): string | null => {
    for (let i = 0; i < holes.length; i++) {
      const h = holes[i];
      const num = startHoleNumber + i;
      if (h.score < 1 || h.score > 20) return `H${num}: スコアは1〜20`;
      if (h.putts < 0 || h.putts > 10) return `H${num}: パットは0〜10`;
      if (h.putts > h.score) return `H${num}: パットがスコアを超えています`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await onSubmit(holes, courseLabel);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Course label selector */}
      {subCourseNames.length > 0 && (
        <div>
          <Label className="text-xs mb-2 block">コース</Label>
          <div className="flex gap-2 flex-wrap">
            {subCourseNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setCourseLabel(name)}
                className={`flex-1 min-w-[60px] py-2 text-sm font-bold rounded border transition-colors ${
                  courseLabel === name
                    ? "bg-green-600 text-white border-green-600"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hole input rows */}
      <div className="space-y-3">
        {holes.map((hole, i) => {
          const holeNum = startHoleNumber + i;
          return (
            <div key={i} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-green-700">
                  H{holeNum}
                </span>
                <div className="flex gap-1">
                  {PAR_OPTIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateHole(i, "par", p)}
                      className={`w-8 h-7 text-xs rounded border transition-colors ${
                        hole.par === p
                          ? "bg-green-600 text-white border-green-600"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      P{p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px]">スコア</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={hole.score}
                    onChange={(e) =>
                      updateHole(i, "score", Number(e.target.value))
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">パット</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={hole.putts}
                    onChange={(e) =>
                      updateHole(i, "putts", Number(e.target.value))
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">FW</Label>
                  {hole.par > 3 ? (
                    <div className="flex gap-1 mt-0.5">
                      {FW_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            updateHole(i, "fairway_result", opt.value)
                          }
                          className={`flex-1 text-xs py-1 rounded border transition-colors ${
                            hole.fairway_result === opt.value
                              ? "bg-green-600 text-white border-green-600"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted-foreground mt-2">
                      -
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px]">OB</Label>
                  <Input
                    type="number"
                    min={0}
                    value={hole.ob}
                    onChange={(e) =>
                      updateHole(i, "ob", Number(e.target.value))
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">バンカー</Label>
                  <Input
                    type="number"
                    min={0}
                    value={hole.bunker}
                    onChange={(e) =>
                      updateHole(i, "bunker", Number(e.target.value))
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">ペナ</Label>
                  <Input
                    type="number"
                    min={0}
                    value={hole.penalty}
                    onChange={(e) =>
                      updateHole(i, "penalty", Number(e.target.value))
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="flex-1"
          disabled={isSaving}
        >
          <X className="w-4 h-4 mr-1" />
          キャンセル
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-1" />
          )}
          {isSaving ? "保存中..." : "保存する"}
        </Button>
      </div>
    </div>
  );
}
