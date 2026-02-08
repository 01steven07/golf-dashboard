"use client";

import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  score: number;
  par: number;
  size?: "sm" | "md" | "lg";
}

// スコアとパーから表示情報を取得
function getScoreInfo(score: number, par: number) {
  const diff = score - par;

  if (score === 0) {
    return { label: "-", symbol: "", color: "gray", bgColor: "bg-gray-100" };
  }

  if (diff <= -3) {
    return { label: "Albatross", symbol: "🦅🦅", color: "text-purple-700", bgColor: "bg-purple-100" };
  }
  if (diff === -2) {
    return { label: "Eagle", symbol: "🦅", color: "text-yellow-700", bgColor: "bg-yellow-100" };
  }
  if (diff === -1) {
    return { label: "Birdie", symbol: "🐦", color: "text-blue-700", bgColor: "bg-blue-100" };
  }
  if (diff === 0) {
    return { label: "Par", symbol: "○", color: "text-green-700", bgColor: "bg-green-100" };
  }
  if (diff === 1) {
    return { label: "Bogey", symbol: "□", color: "text-orange-700", bgColor: "bg-orange-100" };
  }
  if (diff === 2) {
    return { label: "D.Bogey", symbol: "□□", color: "text-red-600", bgColor: "bg-red-100" };
  }
  if (diff === 3) {
    return { label: "T.Bogey", symbol: "□□□", color: "text-red-700", bgColor: "bg-red-200" };
  }
  return { label: `+${diff}`, symbol: "×", color: "text-red-800", bgColor: "bg-red-300" };
}

export function ScoreDisplay({ score, par, size = "md" }: ScoreDisplayProps) {
  const info = getScoreInfo(score, par);

  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-lg",
    lg: "w-20 h-20 text-2xl",
  };

  const symbolSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (score === 0) {
    return (
      <div className={cn(
        "rounded-lg flex flex-col items-center justify-center font-bold",
        sizeClasses[size],
        "bg-gray-100 text-gray-400"
      )}>
        <span>-</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-lg flex flex-col items-center justify-center font-bold",
      sizeClasses[size],
      info.bgColor,
      info.color
    )}>
      <span>{score}</span>
      <span className={symbolSizeClasses[size]}>{info.symbol}</span>
    </div>
  );
}

// インラインで使えるバッジ版
export function ScoreBadge({ score, par }: { score: number; par: number }) {
  const info = getScoreInfo(score, par);

  if (score === 0) {
    return <span className="text-gray-400">-</span>;
  }

  const diff = score - par;
  const diffText = diff === 0 ? "E" : diff > 0 ? `+${diff}` : diff.toString();

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium",
      info.bgColor,
      info.color
    )}>
      <span>{score}</span>
      <span className="text-xs">({diffText})</span>
      <span>{info.symbol}</span>
    </span>
  );
}
