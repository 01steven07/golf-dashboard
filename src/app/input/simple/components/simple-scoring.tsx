"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FairwayResult, CourseWithDetails } from "@/types/database";
import { getScoreSymbol } from "@/utils/golf-symbols";
import { ScoreSummaryBar } from "@/app/input/detailed/components/score-summary-bar";
import { ChevronLeft, ChevronRight, Loader2, Save, Minus, Plus, Pause, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ScoreDisplay } from "@/components/shot-input/score-display";

export interface SimpleHoleScore {
  holeNumber: number;
  par: 3 | 4 | 5 | 6;
  distance: number | null;
  score: number;
  putts: number;
  fairwayResult: FairwayResult;
  ob: number;
  bunker: number;
  penalty: number;
}

interface SimpleScoringProps {
  holes: SimpleHoleScore[];
  currentHole: number;
  isSaving: boolean;
  error: string;
  saveConfirm: { warnings: string[] } | null;
  selectedCourse: CourseWithDetails | null;
  subCourseIds: string[];
  onUpdateHole: (hole: SimpleHoleScore) => void;
  onCurrentHoleChange: (hole: number) => void;
  onSave: () => void;
  onSaveConfirm: () => void;
  onSaveCancel: () => void;
  onBackToSettings: () => void;
  onSuspend: () => void;
  onDiscard: () => void;
}

function Counter({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  colorClass,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  colorClass?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-gray-500">{label}</span>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200"
          disabled={value <= min}
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className={cn("w-6 text-center text-base font-bold", colorClass)}>{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200"
          disabled={value >= max}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

/** Score button color: birdie以下=blue, par=green, bogey以上=gray */
function getScoreButtonStyle(n: number, par: number, isSelected: boolean): string {
  if (!isSelected) return "bg-gray-100 text-gray-700 hover:bg-gray-200";
  const diff = n - par;
  if (diff < 0) return "bg-blue-500 text-white ring-2 ring-blue-400 shadow-md";
  if (diff === 0) return "bg-green-500 text-white ring-2 ring-green-400 shadow-md";
  return "bg-gray-500 text-white ring-2 ring-gray-400 shadow-md";
}

/** Score number pad */
function ScoreNumberPad({
  value,
  par,
  onChange,
}: {
  value: number;
  par: number;
  onChange: (v: number) => void;
}) {
  const [tens, setTens] = useState(false);
  const baseNumbers = tens ? [10, 11, 12, 13, 14, 15, 16, 17, 18, 19] : [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">Score</span>
        {value > 0 && (
          <button
            type="button"
            onClick={() => onChange(0)}
            className="text-[10px] text-gray-400 hover:text-gray-600"
          >
            クリア
          </button>
        )}
      </div>
      <div className="grid grid-cols-5 gap-1">
        {baseNumbers.map((n) => {
          const isSelected = value === n;
          const scoreInfo = getScoreSymbol(n, par);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                "h-10 rounded-lg text-sm font-bold transition-colors relative",
                !isSelected && "active:scale-95",
                getScoreButtonStyle(n, par, isSelected)
              )}
            >
              <span>{n}</span>
              {!isSelected && (
                <span
                  className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] leading-none",
                    scoreInfo.color
                  )}
                >
                  {scoreInfo.symbol}
                </span>
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setTens(!tens)}
          className={cn(
            "h-10 rounded-lg text-xs font-bold transition-colors",
            tens ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          )}
        >
          {tens ? "1-9" : "10+"}
        </button>
      </div>
    </div>
  );
}

/** Putt number pad */
function PuttNumberPad({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-gray-600">Putts</span>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4, 5].map((n) => {
          const isSelected = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                "flex-1 h-10 rounded-lg text-sm font-bold transition-colors",
                !isSelected && "active:scale-95",
                isSelected
                  ? n <= 1
                    ? "bg-blue-500 text-white ring-2 ring-blue-400 shadow-md"
                    : n === 2
                      ? "bg-green-500 text-white ring-2 ring-green-400 shadow-md"
                      : "bg-gray-500 text-white ring-2 ring-gray-400 shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SimpleScoring({
  holes,
  currentHole,
  isSaving,
  error,
  saveConfirm,
  selectedCourse,
  subCourseIds,
  onUpdateHole,
  onCurrentHoleChange,
  onSave,
  onSaveConfirm,
  onSaveCancel,
  onBackToSettings,
  onSuspend,
  onDiscard,
}: SimpleScoringProps) {
  const hole = holes[currentHole - 1];
  const totalHoles = holes.length;

  const updateField = useCallback(
    <K extends keyof SimpleHoleScore>(field: K, value: SimpleHoleScore[K]) => {
      onUpdateHole({ ...hole, [field]: value });
    },
    [hole, onUpdateHole]
  );

  const subCourseInfo = useMemo(() => {
    if (!selectedCourse || subCourseIds.length === 0) {
      const half = Math.ceil(totalHoles / 2);
      const firstHalf = holes.slice(0, half);
      const secondHalf = holes.slice(half);
      return [
        { name: "OUT", holes: firstHalf },
        { name: "IN", holes: secondHalf },
      ].filter((s) => s.holes.length > 0);
    }
    const result: { name: string; holes: SimpleHoleScore[] }[] = [];
    let offset = 0;
    for (const scId of subCourseIds) {
      const sc = selectedCourse.sub_courses.find((s) => s.id === scId);
      if (!sc) continue;
      result.push({
        name: sc.name,
        holes: holes.slice(offset, offset + sc.hole_count),
      });
      offset += sc.hole_count;
    }
    return result;
  }, [selectedCourse, subCourseIds, holes, totalHoles]);

  const stats = useMemo(() => {
    const sectionScores = subCourseInfo.map((s) => ({
      name: s.name,
      score: s.holes.filter((h) => h.score > 0).reduce((sum, h) => sum + h.score, 0),
    }));
    const enteredHoles = holes.filter((h) => h.score > 0);
    const totalScore = enteredHoles.reduce((sum, h) => sum + h.score, 0);
    const totalPar = enteredHoles.reduce((sum, h) => sum + h.par, 0);
    const totalPutts = enteredHoles.reduce((sum, h) => sum + h.putts, 0);
    return {
      sectionScores,
      totalScore,
      totalPar,
      diff: totalScore - totalPar,
      totalPutts,
      enteredCount: enteredHoles.length,
    };
  }, [holes, subCourseInfo]);

  const holeNavButtons = useMemo(
    () =>
      holes.map((h) => {
        const hasData = h.score > 0;
        const scoreDiff = hasData ? h.score - h.par : 0;
        const scoreSymbol = hasData ? getScoreSymbol(h.score, h.par).symbol : "";
        return { ...h, hasData, scoreDiff, scoreSymbol };
      }),
    [holes]
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        {/* Action bar */}
        <div className="flex items-center justify-between px-3 py-1 border-b border-gray-100">
          <button onClick={onBackToSettings} className="p-1 -ml-1 text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-green-800">簡易入力</span>
          <div className="flex gap-0.5">
            <button onClick={onSuspend} className="p-1 text-gray-500" title="中断">
              <Pause className="w-4 h-4" />
            </button>
            <button onClick={onDiscard} className="p-1 text-red-400" title="破棄">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <ScoreSummaryBar
          sectionScores={stats.sectionScores}
          totalScore={stats.totalScore}
          totalPar={stats.totalPar}
          totalPutts={stats.totalPutts}
        />

        {/* Hole navigation */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto">
          {holeNavButtons.map((h) => (
            <button
              key={h.holeNumber}
              onClick={() => onCurrentHoleChange(h.holeNumber)}
              className={cn(
                "flex-shrink-0 min-w-[2.25rem] h-9 px-1 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center",
                currentHole === h.holeNumber
                  ? "bg-green-600 text-white shadow-md"
                  : !h.hasData
                    ? "bg-gray-100 text-gray-500"
                    : h.scoreDiff < 0
                      ? "bg-blue-100 text-blue-700"
                      : h.scoreDiff === 0
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
              )}
            >
              <span>{h.holeNumber}</span>
              {h.hasData && <span className="text-[10px] leading-none">{h.scoreSymbol}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Current hole content */}
      <div className="px-3 py-2 space-y-2 max-w-lg mx-auto">
        {/* Hole header: info left, score+putt right (putt always visible) */}
        <div className="flex items-center justify-between bg-white rounded-xl border-2 border-green-300 px-3 py-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex flex-col items-center justify-center">
              <span className="text-[8px] leading-none">HOLE</span>
              <span className="text-base font-bold leading-none">{currentHole}</span>
            </div>
            <div>
              <span className="text-sm font-bold text-green-700">Par {hole.par}</span>
              {hole.distance && (
                <span className="text-xs text-gray-500 ml-1.5">{hole.distance}yd</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ScoreDisplay score={hole.score} par={hole.par} size="md" />
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex flex-col items-center justify-center">
              <span className="text-[8px] text-purple-400 leading-none">Putt</span>
              <span
                className={cn(
                  "text-base font-bold leading-none",
                  hole.putts > 0 ? "text-purple-700" : "text-gray-300"
                )}
              >
                {hole.putts > 0 ? hole.putts : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Score number pad */}
        <div className="bg-white rounded-xl border px-3 py-2">
          <ScoreNumberPad
            value={hole.score}
            par={hole.par}
            onChange={(v) => updateField("score", v)}
          />
        </div>

        {/* Putt number pad */}
        <div className="bg-white rounded-xl border px-3 py-2">
          <PuttNumberPad value={hole.putts} onChange={(v) => updateField("putts", v)} />
        </div>

        {/* FW + OB/Bunker/Penalty in one row for par4+ */}
        {hole.par >= 4 ? (
          <div className="bg-white rounded-xl border px-3 py-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">FW</span>
              <div className="flex gap-1">
                {[
                  { value: "left" as const, label: "← L" },
                  { value: "keep" as const, label: "Keep" },
                  { value: "right" as const, label: "R →" },
                ].map((fw) => (
                  <button
                    key={fw.value}
                    type="button"
                    onClick={() => updateField("fairwayResult", fw.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      hole.fairwayResult === fw.value
                        ? fw.value === "keep"
                          ? "bg-green-600 text-white"
                          : "bg-gray-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {fw.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-around pt-1 border-t border-gray-100">
              <Counter
                label="OB"
                value={hole.ob}
                onChange={(v) => updateField("ob", v)}
                max={5}
                colorClass={hole.ob > 0 ? "text-gray-800" : undefined}
              />
              <div className="w-px bg-gray-100" />
              <Counter
                label="Bk"
                value={hole.bunker}
                onChange={(v) => updateField("bunker", v)}
                max={5}
                colorClass={hole.bunker > 0 ? "text-gray-800" : undefined}
              />
              <div className="w-px bg-gray-100" />
              <Counter
                label="Pen"
                value={hole.penalty}
                onChange={(v) => updateField("penalty", v)}
                max={5}
                colorClass={hole.penalty > 0 ? "text-gray-800" : undefined}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border px-3 py-2">
            <div className="flex justify-around">
              <Counter
                label="OB"
                value={hole.ob}
                onChange={(v) => updateField("ob", v)}
                max={5}
                colorClass={hole.ob > 0 ? "text-gray-800" : undefined}
              />
              <div className="w-px bg-gray-100" />
              <Counter
                label="Bk"
                value={hole.bunker}
                onChange={(v) => updateField("bunker", v)}
                max={5}
                colorClass={hole.bunker > 0 ? "text-gray-800" : undefined}
              />
              <div className="w-px bg-gray-100" />
              <Counter
                label="Pen"
                value={hole.penalty}
                onChange={(v) => updateField("penalty", v)}
                max={5}
                colorClass={hole.penalty > 0 ? "text-gray-800" : undefined}
              />
            </div>
          </div>
        )}

        {error && <p className="text-xs text-destructive text-center">{error}</p>}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
        <div className="flex items-center justify-between px-4 py-2 max-w-lg mx-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCurrentHoleChange(Math.max(1, currentHole - 1))}
            disabled={currentHole <= 1}
            className="gap-1 h-9"
          >
            <ChevronLeft className="w-4 h-4" />前
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 gap-1.5 h-9"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCurrentHoleChange(Math.min(totalHoles, currentHole + 1))}
            disabled={currentHole >= totalHoles}
            className="gap-1 h-9"
          >
            次<ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Save confirmation dialog */}
      <ConfirmDialog
        open={!!saveConfirm}
        onOpenChange={() => onSaveCancel()}
        title="スコアを保存しますか？"
        confirmLabel="保存する"
        variant="confirm"
        onConfirm={onSaveConfirm}
      >
        {saveConfirm?.warnings && saveConfirm.warnings.length > 0 && (
          <div className="mt-2 space-y-1">
            {saveConfirm.warnings.map((w, i) => (
              <p key={i} className="text-sm text-amber-700">
                {w}
              </p>
            ))}
          </div>
        )}
        <div className="mt-3 space-y-1 text-sm">
          <p>
            スコア: <span className="font-bold">{stats.totalScore}</span> (
            {stats.diff >= 0 ? "+" : ""}
            {stats.diff})
          </p>
          <p>
            パット: <span className="font-bold">{stats.totalPutts}</span>
          </p>
          <p>
            入力済み:{" "}
            <span className="font-bold">
              {stats.enteredCount}/{totalHoles}H
            </span>
          </p>
        </div>
      </ConfirmDialog>
    </div>
  );
}
