"use client";

import { PuttShot } from "@/types/shot";
import { PUTT_LINES, PUTT_RESULTS, RATINGS } from "./constants";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface PuttInputProps {
  shot: PuttShot;
  onChange: (shot: PuttShot) => void;
  puttNumber: number;
}

export function PuttInput({ shot, onChange, puttNumber }: PuttInputProps) {
  return (
    <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
      <h4 className="font-semibold text-purple-800">
        {puttNumber}パット目
      </h4>

      {/* 距離 */}
      <div>
        <Label className="text-sm text-gray-600">距離 (m)</Label>
        <Input
          type="number"
          value={shot.distance}
          onChange={(e) => onChange({ ...shot, distance: Number(e.target.value) || 0 })}
          className="mt-1 w-24"
          min={0}
          max={50}
          step={0.5}
        />
      </div>

      {/* ライン */}
      <div>
        <Label className="text-sm text-gray-600">ライン</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {PUTT_LINES.map((line) => (
            <button
              key={line.value}
              type="button"
              onClick={() => onChange({ ...shot, line: line.value })}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                shot.line === line.value
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-purple-400"
              }`}
            >
              {line.label}
            </button>
          ))}
        </div>
      </div>

      {/* 結果 */}
      <div>
        <Label className="text-sm text-gray-600">結果</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {PUTT_RESULTS.map((result) => (
            <button
              key={result.value}
              type="button"
              onClick={() => onChange({ ...shot, result: result.value })}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                shot.result === result.value
                  ? result.value === "in"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-700 border-gray-300 hover:border-purple-400"
              }`}
            >
              {result.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5点採点 */}
      <div>
        <Label className="text-sm text-gray-600">評価</Label>
        <div className="flex gap-2 mt-1">
          {RATINGS.map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange({ ...shot, rating })}
              className={`w-10 h-10 text-sm rounded-full border transition-colors ${
                shot.rating === rating
                  ? "bg-yellow-500 text-white border-yellow-500"
                  : "bg-white text-gray-700 border-gray-300 hover:border-yellow-400"
              }`}
            >
              {rating}
            </button>
          ))}
        </div>
      </div>

      {/* メモ */}
      <div>
        <Label className="text-sm text-gray-600">メモ</Label>
        <Textarea
          value={shot.note}
          onChange={(e) => onChange({ ...shot, note: e.target.value })}
          placeholder="例: 読み違い、タッチが弱い"
          className="mt-1 h-16"
        />
      </div>
    </div>
  );
}
