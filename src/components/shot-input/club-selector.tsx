"use client";

import { useState, useMemo } from "react";
import { Club } from "@/types/shot";
import { ClubType } from "@/types/database";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

interface ClubSelectorProps {
  value: Club;
  onChange: (value: Club) => void;
  excludePutter?: boolean;
}

type ClubCategory = "wood" | "ut" | "iron" | "wedge" | "putter";

const CLUB_CATEGORIES: {
  id: ClubCategory;
  name: string;
  clubs: { value: Club; label: string }[];
}[] = [
  {
    id: "wood",
    name: "W",
    clubs: [
      { value: "1W", label: "1W" },
      { value: "3W", label: "3W" },
      { value: "5W", label: "5W" },
      { value: "7W", label: "7W" },
    ],
  },
  {
    id: "ut",
    name: "UT",
    clubs: [
      { value: "UT2", label: "2U" },
      { value: "UT3", label: "3U" },
      { value: "UT4", label: "4U" },
      { value: "UT5", label: "5U" },
      { value: "UT6", label: "6U" },
      { value: "UT7", label: "7U" },
    ],
  },
  {
    id: "iron",
    name: "I",
    clubs: [
      { value: "2I", label: "2I" },
      { value: "3I", label: "3I" },
      { value: "4I", label: "4I" },
      { value: "5I", label: "5I" },
      { value: "6I", label: "6I" },
      { value: "7I", label: "7I" },
      { value: "8I", label: "8I" },
      { value: "9I", label: "9I" },
    ],
  },
  {
    id: "wedge",
    name: "WG",
    clubs: [
      { value: "PW", label: "PW" },
      { value: "46", label: "46°" },
      { value: "48", label: "48°" },
      { value: "50", label: "50°" },
      { value: "52", label: "52°" },
      { value: "54", label: "54°" },
      { value: "56", label: "56°" },
      { value: "58", label: "58°" },
      { value: "60", label: "60°" },
    ],
  },
  {
    id: "putter",
    name: "PT",
    clubs: [{ value: "PT", label: "PT" }],
  },
];

// クラブからカテゴリを取得
function getCategoryFromClub(club: Club): ClubCategory {
  if (["1W", "3W", "5W", "7W"].includes(club)) return "wood";
  if (club.startsWith("UT")) return "ut";
  if (["2I", "3I", "4I", "5I", "6I", "7I", "8I", "9I"].includes(club)) return "iron";
  if (club === "PW" || ["46", "48", "50", "52", "54", "56", "58", "60"].includes(club)) return "wedge";
  return "putter";
}

export function ClubSelector({ value, onChange, excludePutter }: ClubSelectorProps) {
  const { member } = useAuth();
  const memberClubs = member?.clubs;
  const [activeCategory, setActiveCategory] = useState<ClubCategory>(getCategoryFromClub(value));

  const categories = useMemo(() => {
    let cats = excludePutter
      ? CLUB_CATEGORIES.filter((c) => c.id !== "putter")
      : CLUB_CATEGORIES;

    // メンバーがクラブセットを登録済みの場合、登録クラブのみ表示
    if (memberClubs && memberClubs.length > 0) {
      cats = cats
        .map((cat) => ({
          ...cat,
          clubs: cat.clubs.filter((c) => memberClubs.includes(c.value as ClubType)),
        }))
        .filter((cat) => cat.clubs.length > 0);
    }

    return cats;
  }, [excludePutter, memberClubs]);

  const activeClubs = categories.find((c) => c.id === activeCategory)?.clubs || [];

  return (
    <div className="space-y-2">
      {/* カテゴリタブ - 横スクロール */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          const hasSelectedClub = category.clubs.some((c) => c.value === value);

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1",
                isActive
                  ? "bg-green-600 text-white"
                  : hasSelectedClub
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {category.name}
            </button>
          );
        })}
      </div>

      {/* 選択中のカテゴリのクラブ一覧 */}
      <div className="flex flex-wrap gap-2">
        {activeClubs.map((club) => (
          <button
            key={club.value}
            type="button"
            onClick={() => onChange(club.value)}
            className={cn(
              "min-w-[3.5rem] px-4 py-3 rounded-xl text-base font-bold transition-all",
              value === club.value
                ? "bg-green-600 text-white shadow-lg ring-2 ring-green-300"
                : "bg-white text-gray-700 border-2 border-gray-200 hover:border-green-400"
            )}
          >
            {club.label}
          </button>
        ))}
      </div>

      {/* 現在選択中のクラブ表示 */}
      <div className="text-center text-sm text-gray-500">
        選択中: <span className="font-bold text-green-700">{value}</span>
      </div>
    </div>
  );
}
