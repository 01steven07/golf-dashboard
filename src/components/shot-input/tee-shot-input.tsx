"use client";

import { TeeShot } from "@/types/shot";
import { CLUBS, WIND_DIRECTIONS, LEFT_RIGHT, TEE_RESULTS, RATINGS } from "./constants";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TeeShotInputProps {
  shot: TeeShot;
  onChange: (shot: TeeShot) => void;
}

export function TeeShotInput({ shot, onChange }: TeeShotInputProps) {
  return (
    <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
      <h4 className="font-semibold text-green-800">ティーショット</h4>

      {/* クラブ */}
      <div>
        <Label className="text-sm text-gray-600">クラブ</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {CLUBS.filter((c) => c.value !== "PT").map((club) => (
            <button
              key={club.value}
              type="button"
              onClick={() => onChange({ ...shot, club: club.value })}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                shot.club === club.value
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
              }`}
            >
              {club.label}
            </button>
          ))}
        </div>
      </div>

      {/* 結果 */}
      <div>
        <Label className="text-sm text-gray-600">結果</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {TEE_RESULTS.map((result) => (
            <button
              key={result.value}
              type="button"
              onClick={() => onChange({ ...shot, result: result.value })}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                shot.result === result.value
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
              }`}
            >
              {result.label}
            </button>
          ))}
        </div>
      </div>

      {/* 結果方向（左右） */}
      <div>
        <Label className="text-sm text-gray-600">方向</Label>
        <div className="flex gap-2 mt-1">
          {LEFT_RIGHT.map((dir) => (
            <button
              key={dir.value}
              type="button"
              onClick={() => onChange({ ...shot, resultDirection: dir.value })}
              className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
                shot.resultDirection === dir.value
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
              }`}
            >
              {dir.label}
            </button>
          ))}
        </div>
      </div>

      {/* 風 */}
      <div>
        <Label className="text-sm text-gray-600">風</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {WIND_DIRECTIONS.map((wind) => (
            <button
              key={wind.value}
              type="button"
              onClick={() => onChange({ ...shot, wind: wind.value })}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                shot.wind === wind.value
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
              }`}
            >
              {wind.label}
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
          placeholder="例: スライスが強かった"
          className="mt-1 h-16"
        />
      </div>
    </div>
  );
}
