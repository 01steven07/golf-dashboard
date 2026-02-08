"use client";

import { ApproachShot } from "@/types/shot";
import { CLUBS, WIND_DIRECTIONS, SHOT_LIES, SLOPES, SHOT_RESULTS, RATINGS } from "./constants";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ApproachShotInputProps {
  shot: ApproachShot;
  onChange: (shot: ApproachShot) => void;
  shotNumber: number;
}

export function ApproachShotInput({ shot, onChange, shotNumber }: ApproachShotInputProps) {
  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h4 className="font-semibold text-blue-800">
        {shotNumber}打目（ショット/アプローチ）
      </h4>

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
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
              }`}
            >
              {club.label}
            </button>
          ))}
        </div>
      </div>

      {/* 残り距離 */}
      <div>
        <Label className="text-sm text-gray-600">残り距離 (yd)</Label>
        <Input
          type="number"
          value={shot.distance}
          onChange={(e) => onChange({ ...shot, distance: Number(e.target.value) || 0 })}
          className="mt-1 w-24"
          min={0}
          max={600}
        />
      </div>

      {/* ライ */}
      <div>
        <Label className="text-sm text-gray-600">ライ</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {SHOT_LIES.map((lie) => (
            <button
              key={lie.value}
              type="button"
              onClick={() => onChange({ ...shot, lie: lie.value })}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                shot.lie === lie.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
              }`}
            >
              {lie.label}
            </button>
          ))}
        </div>
      </div>

      {/* 傾斜 */}
      <div>
        <Label className="text-sm text-gray-600">傾斜</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {SLOPES.map((slope) => (
            <button
              key={slope.value}
              type="button"
              onClick={() => onChange({ ...shot, slope: slope.value })}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                shot.slope === slope.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
              }`}
            >
              {slope.label}
            </button>
          ))}
        </div>
      </div>

      {/* 結果 */}
      <div>
        <Label className="text-sm text-gray-600">結果</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {SHOT_RESULTS.map((result) => (
            <button
              key={result.value}
              type="button"
              onClick={() => onChange({ ...shot, result: result.value })}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                shot.result === result.value
                  ? result.value.startsWith("on-")
                    ? "bg-green-600 text-white border-green-600"
                    : result.value.startsWith("ob-") || result.value.startsWith("penalty-")
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
              }`}
            >
              {result.label}
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
                  ? "bg-sky-500 text-white border-sky-500"
                  : "bg-white text-gray-700 border-gray-300 hover:border-sky-300"
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
          placeholder="例: ダフった、トップした"
          className="mt-1 h-16"
        />
      </div>
    </div>
  );
}
