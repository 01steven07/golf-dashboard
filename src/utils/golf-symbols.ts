import { FairwayResult } from "@/types/database";

export interface ScoreSymbolInfo {
  label: string;
  symbol: string;
  color: string;
  bgColor: string;
}

export interface FairwaySymbolInfo {
  symbol: string;
  label: string;
  color: string;
}

/**
 * スコアとパーからゴルフシンボル情報を取得
 */
export function getScoreSymbol(score: number, par: number): ScoreSymbolInfo {
  if (score === 0) {
    return { label: "-", symbol: "", color: "text-gray-400", bgColor: "bg-gray-100" };
  }

  const diff = score - par;

  if (diff <= -3) {
    return { label: "Albatross", symbol: "◎◎", color: "text-purple-700", bgColor: "bg-purple-100" };
  }
  if (diff === -2) {
    return { label: "Eagle", symbol: "◎", color: "text-yellow-700", bgColor: "bg-yellow-100" };
  }
  if (diff === -1) {
    return { label: "Birdie", symbol: "○", color: "text-blue-700", bgColor: "bg-blue-100" };
  }
  if (diff === 0) {
    return { label: "Par", symbol: "-", color: "text-green-700", bgColor: "bg-green-100" };
  }
  if (diff === 1) {
    return { label: "Bogey", symbol: "△", color: "text-orange-700", bgColor: "bg-orange-100" };
  }
  if (diff === 2) {
    return { label: "D.Bogey", symbol: "□", color: "text-red-600", bgColor: "bg-red-100" };
  }
  if (diff === 3) {
    return { label: "+3", symbol: "+3", color: "text-red-700", bgColor: "bg-red-200" };
  }
  return { label: `+${diff}`, symbol: `+${diff}`, color: "text-red-800", bgColor: "bg-red-300" };
}

/**
 * フェアウェイ結果からシンボル情報を取得
 */
export function getFairwaySymbol(result: FairwayResult): FairwaySymbolInfo {
  switch (result) {
    case "keep":
      return { symbol: "◯", label: "Keep", color: "text-green-600" };
    case "left":
      return { symbol: "←", label: "Left", color: "text-orange-600" };
    case "right":
      return { symbol: "→", label: "Right", color: "text-orange-600" };
  }
}
