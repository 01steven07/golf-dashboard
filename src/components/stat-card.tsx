"use client";

import { useState, type ReactNode } from "react";
import { Info } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  description?: string;
  unavailable?: boolean;
  clubAvg?: string;
  rank?: number;
  totalMembers?: number;
  icon?: ReactNode;
}

/** 順位に応じたアクセントカラーを返す */
function getRankColor(rank: number, total: number): { border: string; badge: string } {
  const pct = rank / total;
  if (rank === 1) return { border: "border-l-amber-400", badge: "bg-amber-100 text-amber-700" };
  if (rank === 2) return { border: "border-l-gray-300", badge: "bg-gray-100 text-gray-600" };
  if (rank === 3) return { border: "border-l-orange-300", badge: "bg-orange-50 text-orange-600" };
  if (pct <= 0.33) return { border: "border-l-green-400", badge: "bg-green-50 text-green-700" };
  if (pct <= 0.66) return { border: "border-l-blue-300", badge: "bg-blue-50 text-blue-600" };
  return { border: "border-l-rose-300", badge: "bg-rose-50 text-rose-600" };
}

export function StatCard({ label, value, description, unavailable, clubAvg, rank, totalMembers, icon }: StatCardProps) {
  const [showDescription, setShowDescription] = useState(false);

  const hasRank = !unavailable && !!clubAvg && !!rank && !!totalMembers;
  const colors = hasRank ? getRankColor(rank, totalMembers) : null;

  return (
    <div
      className={`p-4 rounded-lg relative border-l-[3px] ${
        unavailable
          ? "bg-muted/30 opacity-50 border-l-transparent"
          : colors
            ? `bg-muted/50 ${colors.border}`
            : "bg-muted/50 border-l-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && (
            <span className="text-muted-foreground flex-shrink-0">{icon}</span>
          )}
          <p className="text-sm text-muted-foreground truncate">{label}</p>
        </div>
        {description && (
          <button
            type="button"
            onClick={() => setShowDescription(!showDescription)}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="text-2xl font-bold mt-1">
        {unavailable ? "-" : value}
      </p>

      {hasRank && colors && (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              部平均 {clubAvg}
            </span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${colors.badge}`}>
              {rank}位/{totalMembers}人
            </span>
          </div>

          <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all"
              style={{
                width: `${Math.max(8, ((totalMembers - rank + 1) / totalMembers) * 100)}%`,
                backgroundColor:
                  rank <= 3
                    ? rank === 1 ? "#f59e0b" : rank === 2 ? "#9ca3af" : "#f97316"
                    : rank / totalMembers <= 0.33
                      ? "#22c55e"
                      : rank / totalMembers <= 0.66
                        ? "#3b82f6"
                        : "#f43f5e",
              }}
            />
          </div>
        </div>
      )}

      {showDescription && description && (
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          {description}
        </p>
      )}
      {unavailable && (
        <p className="text-xs text-muted-foreground mt-1">詳細入力データが必要です</p>
      )}
    </div>
  );
}
