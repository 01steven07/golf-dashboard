"use client";

import { useState } from "react";
import { Score, FairwayResult } from "@/types/database";
import {
  Shot,
  ApproachShot,
  PuttShot,
  createDefaultTeeShot,
  createDefaultApproachShot,
  createDefaultPutt,
  DEFAULT_OPTIONAL_FIELDS,
} from "@/types/shot";
import { parseShots } from "@/utils/course-stats";
import { computeScoreFromShots, detectShotScoreMismatch } from "@/utils/shot-score-validation";
import { TeeShotInput } from "@/components/shot-input/tee-shot-input";
import { ApproachShotInput } from "@/components/shot-input/approach-shot-input";
import { PuttInput } from "@/components/shot-input/putt-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Flag,
  Target,
  Circle,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface HoleEditFormProps {
  score: Score;
  onSave: (data: {
    score_id: string;
    score: number;
    putts: number;
    fairway_result: FairwayResult;
    ob: number;
    bunker: number;
    penalty: number;
    pin_position: string | null;
    shots_detail: Shot[] | null;
  }) => Promise<void>;
  onCancel: () => void;
}

const FW_OPTIONS: { value: FairwayResult; label: string }[] = [
  { value: "keep", label: "キープ" },
  { value: "left", label: "左" },
  { value: "right", label: "右" },
];

function getShotSummary(shot: Shot): string {
  if (shot.type === "tee") {
    const resultLabels: Record<string, string> = {
      fairway: "FW", rough: "ラフ", bunker: "バンカー", ob: "OB", penalty: "ペナ",
    };
    return `${shot.club} → ${resultLabels[shot.result] ?? shot.result}`;
  }
  if (shot.type === "approach") {
    const cat = shot.result.startsWith("on-") ? "ON" : shot.result.startsWith("miss-") ? "外し" : shot.result;
    return `${shot.club} ${shot.distance}yd → ${cat}`;
  }
  if (shot.note === "OK") return "OKパット";
  const puttLabels: Record<string, string> = {
    in: "IN", front: "ショート", back: "オーバー", left: "左", right: "右",
  };
  return `${shot.distance}m → ${puttLabels[shot.result] ?? shot.result}`;
}

export function HoleEditForm({ score, onSave, onCancel }: HoleEditFormProps) {
  const [editScore, setEditScore] = useState(String(score.score));
  const [editPutts, setEditPutts] = useState(String(score.putts));
  const [editFW, setEditFW] = useState<FairwayResult>(score.fairway_result);
  const [editOB, setEditOB] = useState(String(score.ob));
  const [editBunker, setEditBunker] = useState(String(score.bunker));
  const [editPenalty, setEditPenalty] = useState(String(score.penalty));
  const [editPinPosition] = useState<string | null>(score.pin_position);
  const [shots, setShots] = useState<Shot[]>(() => parseShots(score.shots_detail));
  const [expandedShot, setExpandedShot] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasShots = shots.length > 0;

  // Auto-calculate score and putts from shot details
  const ob = Number(editOB) || 0;
  const penalty = Number(editPenalty) || 0;
  const { computedScore, computedPutts } = computeScoreFromShots(shots, ob, penalty);

  // Mismatch warnings (when shots exist but saved values differ)
  const scoreFromInput = hasShots ? computedScore : Number(editScore) || 0;
  const puttsFromInput = hasShots ? computedPutts : Number(editPutts) || 0;
  const mismatches = detectShotScoreMismatch(shots, score.score, score.putts, ob, penalty);

  // Sync editScore/editPutts when shots change (so handleSave uses correct values)
  const prevComputedScore = String(computedScore);
  const prevComputedPutts = String(computedPutts);
  if (hasShots && editScore !== prevComputedScore) {
    setEditScore(prevComputedScore);
  }
  if (hasShots && editPutts !== prevComputedPutts) {
    setEditPutts(prevComputedPutts);
  }

  const addShot = (type: "tee" | "approach" | "putt") => {
    let newShot: Shot;
    switch (type) {
      case "tee": newShot = createDefaultTeeShot(); break;
      case "approach": newShot = createDefaultApproachShot(); break;
      case "putt": newShot = createDefaultPutt(); break;
    }
    setShots((prev) => [...prev, newShot]);
    setExpandedShot(shots.length);
  };

  const updateShot = (index: number, shot: Shot) => {
    setShots((prev) => {
      const next = [...prev];
      next[index] = shot;
      return next;
    });
  };

  const removeShot = (index: number) => {
    setShots((prev) => prev.filter((_, i) => i !== index));
    setExpandedShot(null);
  };

  const moveShot = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= shots.length) return;
    setShots((prev) => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
    setExpandedShot(newIndex);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        score_id: score.id,
        score: scoreFromInput,
        putts: puttsFromInput,
        fairway_result: editFW,
        ob: Number(editOB) || 0,
        bunker: Number(editBunker) || 0,
        penalty: Number(editPenalty) || 0,
        pin_position: editPinPosition,
        shots_detail: shots.length > 0 ? shots : null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  let approachNum = 0;
  let puttNum = 0;

  return (
    <div className="space-y-4">
      {/* Mismatch warnings */}
      {mismatches.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700 space-y-0.5">
            {mismatches.map((m) => (
              <p key={m.field}>{m.message}</p>
            ))}
          </div>
        </div>
      )}

      {/* Basic info */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">スコア</Label>
          {hasShots ? (
            <div className="h-9 flex items-center px-3 rounded-md border bg-muted text-sm font-medium">
              {computedScore}
            </div>
          ) : (
            <Input
              type="number"
              min={1}
              value={editScore}
              onChange={(e) => setEditScore(e.target.value)}
              className="h-9"
            />
          )}
        </div>
        <div>
          <Label className="text-xs">パット</Label>
          {hasShots ? (
            <div className="h-9 flex items-center px-3 rounded-md border bg-muted text-sm font-medium">
              {computedPutts}
            </div>
          ) : (
            <Input
              type="number"
              min={0}
              value={editPutts}
              onChange={(e) => setEditPutts(e.target.value)}
              className="h-9"
            />
          )}
        </div>
        <div>
          <Label className="text-xs">FW結果</Label>
          {score.par > 3 ? (
            <div className="flex gap-1 mt-1">
              {FW_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEditFW(opt.value)}
                  className={`flex-1 text-xs py-1.5 rounded border transition-colors ${
                    editFW === opt.value
                      ? "bg-green-600 text-white border-green-600"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground mt-2">Par3: -</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">OB</Label>
          <Input
            type="number"
            min={0}
            value={editOB}
            onChange={(e) => setEditOB(e.target.value)}
            className="h-9"
          />
        </div>
        <div>
          <Label className="text-xs">バンカー</Label>
          <Input
            type="number"
            min={0}
            value={editBunker}
            onChange={(e) => setEditBunker(e.target.value)}
            className="h-9"
          />
        </div>
        <div>
          <Label className="text-xs">ペナルティ</Label>
          <Input
            type="number"
            min={0}
            value={editPenalty}
            onChange={(e) => setEditPenalty(e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {/* Shot add buttons */}
      <div>
        <Label className="text-xs mb-2 block">
          ショット詳細
          {hasShots && (
            <span className="ml-2 text-muted-foreground font-normal">
              ({shots.length}打 = スコア{computedScore})
            </span>
          )}
        </Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addShot("tee")}
            className="flex-1 text-green-700 border-green-300 bg-green-50"
          >
            <Flag className="w-3.5 h-3.5 mr-1" />
            ティー
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addShot("approach")}
            className="flex-1 text-blue-700 border-blue-300 bg-blue-50"
          >
            <Target className="w-3.5 h-3.5 mr-1" />
            ショット
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addShot("putt")}
            className="flex-1 text-purple-700 border-purple-300 bg-purple-50"
          >
            <Circle className="w-3.5 h-3.5 mr-1" />
            パット
          </Button>
        </div>
      </div>

      {/* Shot list */}
      {shots.length > 0 && (
        <div className="space-y-2">
          {shots.map((shot, index) => {
            if (shot.type === "approach") approachNum++;
            if (shot.type === "putt") puttNum++;

            const isExpanded = expandedShot === index;
            const icon = shot.type === "tee"
              ? <Flag className="w-3.5 h-3.5 text-green-600 shrink-0" />
              : shot.type === "approach"
                ? <Target className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                : <Circle className="w-3.5 h-3.5 text-purple-600 shrink-0" />;

            const borderColor = shot.type === "tee"
              ? "border-green-200"
              : shot.type === "approach"
                ? "border-blue-200"
                : "border-purple-200";

            const bgColor = shot.type === "tee"
              ? "bg-green-50"
              : shot.type === "approach"
                ? "bg-blue-50"
                : "bg-purple-50";

            return (
              <Card key={index} className={`border ${borderColor} overflow-hidden`}>
                <div
                  className={`${bgColor} px-2 py-1.5 flex items-center justify-between cursor-pointer`}
                  onClick={() => setExpandedShot(isExpanded ? null : index)}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-500 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
                    {icon}
                    <span className="text-xs font-medium truncate">
                      {index + 1}. {getShotSummary(shot)}
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button type="button" onClick={(e) => { e.stopPropagation(); moveShot(index, "up"); }} disabled={index === 0} className="p-0.5 text-gray-500 hover:bg-white/50 rounded disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); moveShot(index, "down"); }} disabled={index === shots.length - 1} className="p-0.5 text-gray-500 hover:bg-white/50 rounded disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeShot(index); }} className="p-0.5 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
                {isExpanded && (
                  <CardContent className="p-3">
                    {shot.type === "tee" && (
                      <TeeShotInput
                        shot={shot}
                        onChange={(s) => updateShot(index, s)}
                        par={score.par}
                        optionalFields={DEFAULT_OPTIONAL_FIELDS}
                      />
                    )}
                    {shot.type === "approach" && (
                      <ApproachShotInput
                        shot={shot as ApproachShot}
                        onChange={(s) => updateShot(index, s)}
                        shotNumber={approachNum}
                        optionalFields={DEFAULT_OPTIONAL_FIELDS}
                      />
                    )}
                    {shot.type === "putt" && (
                      <PuttInput
                        shot={shot as PuttShot}
                        onChange={(s) => updateShot(index, s)}
                        puttNumber={puttNum}
                        optionalFields={DEFAULT_OPTIONAL_FIELDS}
                      />
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Save / Cancel */}
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
          onClick={handleSave}
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-1" />
          )}
          {isSaving ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  );
}
