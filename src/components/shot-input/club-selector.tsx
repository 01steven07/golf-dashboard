"use client";

import { Club } from "@/types/shot";
import { cn } from "@/lib/utils";

interface ClubSelectorProps {
  value: Club;
  onChange: (value: Club) => void;
  excludePutter?: boolean;
}

const CLUB_CATEGORIES = [
  {
    name: "ウッド",
    clubs: [
      { value: "1W" as Club, label: "1W", icon: "🪵" },
      { value: "3W" as Club, label: "3W", icon: "🪵" },
      { value: "5W" as Club, label: "5W", icon: "🪵" },
      { value: "7W" as Club, label: "7W", icon: "🪵" },
    ],
  },
  {
    name: "UT",
    clubs: [{ value: "UT" as Club, label: "UT", icon: "🔧" }],
  },
  {
    name: "アイアン",
    clubs: [
      { value: "3I" as Club, label: "3I", icon: "⛳" },
      { value: "4I" as Club, label: "4I", icon: "⛳" },
      { value: "5I" as Club, label: "5I", icon: "⛳" },
      { value: "6I" as Club, label: "6I", icon: "⛳" },
      { value: "7I" as Club, label: "7I", icon: "⛳" },
      { value: "8I" as Club, label: "8I", icon: "⛳" },
      { value: "9I" as Club, label: "9I", icon: "⛳" },
    ],
  },
  {
    name: "ウェッジ",
    clubs: [
      { value: "PW" as Club, label: "PW", icon: "🎯" },
      { value: "AW" as Club, label: "AW", icon: "🎯" },
      { value: "SW" as Club, label: "SW", icon: "🎯" },
      { value: "LW" as Club, label: "LW", icon: "🎯" },
    ],
  },
];

export function ClubSelector({ value, onChange, excludePutter }: ClubSelectorProps) {
  return (
    <div className="space-y-3">
      {CLUB_CATEGORIES.map((category) => (
        <div key={category.name}>
          <div className="text-xs text-gray-500 mb-1">{category.name}</div>
          <div className="flex flex-wrap gap-1.5">
            {category.clubs.map((club) => (
              <button
                key={club.value}
                type="button"
                onClick={() => onChange(club.value)}
                className={cn(
                  "min-w-[3rem] px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  value === club.value
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {club.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      {!excludePutter && (
        <div>
          <div className="text-xs text-gray-500 mb-1">パター</div>
          <button
            type="button"
            onClick={() => onChange("PT")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              value === "PT"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            🕳️ PT
          </button>
        </div>
      )}
    </div>
  );
}
