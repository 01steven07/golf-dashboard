"use client";

import { cn } from "@/lib/utils";
import { getScoreSymbol } from "@/utils/golf-symbols";

interface ScoreDisplayProps {
  score: number;
  par: number;
  size?: "sm" | "md" | "lg";
}

export function ScoreDisplay({ score, par, size = "md" }: ScoreDisplayProps) {
  const info = getScoreSymbol(score, par);

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
  const info = getScoreSymbol(score, par);

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
