import { FairwayResult } from "@/types/database";
import { SCORE_TW } from "@/utils/score-colors";

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

  if (diff <= -2) {
    return { label: diff <= -3 ? "Albatross" : "Eagle", symbol: diff <= -3 ? "◎◎" : "◎", ...SCORE_TW.eagle };
  }
  if (diff === -1) {
    return { label: "Birdie", symbol: "○", ...SCORE_TW.birdie };
  }
  if (diff === 0) {
    return { label: "Par", symbol: "-", ...SCORE_TW.par };
  }
  if (diff === 1) {
    return { label: "Bogey", symbol: "△", ...SCORE_TW.bogey };
  }
  if (diff === 2) {
    return { label: "D.Bogey", symbol: "□", ...SCORE_TW.doubleBogey };
  }
  return { label: `+${diff}`, symbol: `+${diff}`, ...SCORE_TW.triplePlus };
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
