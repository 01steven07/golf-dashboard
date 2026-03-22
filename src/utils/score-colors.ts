/**
 * スコア種別のカラーパレット（アプリ全体で統一）
 *
 * Eagle-  : blue     — 特別な好スコア
 * Birdie  : blue     — 好スコア
 * Par     : green    — 基準
 * Bogey   : slate    — 許容範囲
 * D.Bogey+: slate    — 要改善
 */

/** Hex (グラフ・SVG用) */
export const SCORE_COLORS = {
  eagle: "#3b82f6", // blue-500
  birdie: "#60a5fa", // blue-400
  par: "#22c55e", // green-500
  bogey: "#94a3b8", // slate-400
  doublePlus: "#64748b", // slate-500
} as const;

/** Tailwind text/bg (スコアカード・バッジ用) */
export const SCORE_TW = {
  eagle: { color: "text-blue-700", bgColor: "bg-blue-100" },
  birdie: { color: "text-blue-600", bgColor: "bg-blue-50" },
  par: { color: "text-green-700", bgColor: "" },
  bogey: { color: "text-gray-500", bgColor: "bg-gray-100" },
  doubleBogey: { color: "text-gray-600", bgColor: "bg-gray-200" },
  triplePlus: { color: "text-gray-700", bgColor: "bg-gray-300" },
} as const;
