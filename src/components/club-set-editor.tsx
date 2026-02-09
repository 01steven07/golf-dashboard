"use client";

import { ClubType } from "@/types/database";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ClubSetEditorProps {
  value: ClubType[];
  onChange: (clubs: ClubType[]) => void;
  disabled?: boolean;
}

type ClubCategory = {
  name: string;
  clubs: { type: ClubType; label: string }[];
};

const CLUB_CATEGORIES: ClubCategory[] = [
  {
    name: "ウッド",
    clubs: [
      { type: "1W", label: "1W" },
      { type: "3W", label: "3W" },
      { type: "5W", label: "5W" },
      { type: "7W", label: "7W" },
    ],
  },
  {
    name: "UT",
    clubs: [
      { type: "UT2", label: "2U" },
      { type: "UT3", label: "3U" },
      { type: "UT4", label: "4U" },
      { type: "UT5", label: "5U" },
      { type: "UT6", label: "6U" },
      { type: "UT7", label: "7U" },
    ],
  },
  {
    name: "アイアン",
    clubs: [
      { type: "2I", label: "2I" },
      { type: "3I", label: "3I" },
      { type: "4I", label: "4I" },
      { type: "5I", label: "5I" },
      { type: "6I", label: "6I" },
      { type: "7I", label: "7I" },
      { type: "8I", label: "8I" },
      { type: "9I", label: "9I" },
    ],
  },
  {
    name: "ウェッジ",
    clubs: [
      { type: "PW", label: "PW" },
      { type: "46", label: "46°" },
      { type: "48", label: "48°" },
      { type: "50", label: "50°" },
      { type: "52", label: "52°" },
      { type: "54", label: "54°" },
      { type: "56", label: "56°" },
      { type: "58", label: "58°" },
      { type: "60", label: "60°" },
    ],
  },
  {
    name: "パター",
    clubs: [{ type: "PT", label: "PT" }],
  },
];

// Standard 14-club preset
const STANDARD_PRESET: ClubType[] = [
  "1W", "3W", "5W", "UT5", "5I", "6I", "7I", "8I", "9I", "PW", "50", "54", "58", "PT"
];

export function ClubSetEditor({ value, onChange, disabled }: ClubSetEditorProps) {
  const toggleClub = (club: ClubType) => {
    if (disabled) return;
    if (value.includes(club)) {
      onChange(value.filter((c) => c !== club));
    } else {
      onChange([...value, club]);
    }
  };

  const selectPreset = () => {
    if (disabled) return;
    onChange(STANDARD_PRESET);
  };

  return (
    <div className="space-y-4">
      {/* プリセットボタン */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={selectPreset}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
        >
          標準セット (14本)
        </button>
      </div>

      {/* カテゴリ別クラブ選択 */}
      {CLUB_CATEGORIES.map((category) => (
        <div key={category.name}>
          <p className="text-sm font-medium text-muted-foreground mb-2">{category.name}</p>
          <div className="flex flex-wrap gap-2">
            {category.clubs.map((club) => {
              const isSelected = value.includes(club.type);
              return (
                <button
                  key={club.type}
                  type="button"
                  onClick={() => toggleClub(club.type)}
                  disabled={disabled}
                  className={cn(
                    "relative px-4 py-2 rounded-lg font-medium text-sm transition-all",
                    "min-w-[50px] flex items-center justify-center",
                    isSelected
                      ? "bg-green-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {club.label}
                  {isSelected && (
                    <Check className="absolute -top-1 -right-1 w-4 h-4 bg-green-700 rounded-full p-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* 選択数表示 */}
      <div className="text-sm text-muted-foreground">
        選択中: <span className="font-bold text-foreground">{value.length}本</span>
        {value.length > 14 && (
          <span className="text-orange-500 ml-2">
            (ルール上限は14本です)
          </span>
        )}
      </div>
    </div>
  );
}
