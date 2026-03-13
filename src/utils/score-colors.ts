/**
 * スコア種別のカラーパレット（アプリ全体で統一）
 * パステル寄りの柔らかいトーンで統一
 *
 * Eagle-  : amber    — 特別な成果
 * Birdie  : rose     — 好スコア
 * Par     : sky      — 基準
 * Bogey   : emerald  — 許容範囲
 * D.Bogey+: slate    — 要改善
 */

/** Hex (グラフ・SVG用) — 300〜400系の柔らかい色 */
export const SCORE_COLORS = {
  eagle: "#fbbf24",      // amber-400
  birdie: "#fb7185",     // rose-400
  par: "#38bdf8",        // sky-400
  bogey: "#34d399",      // emerald-400
  doublePlus: "#94a3b8", // slate-400
} as const;

/** Tailwind text/bg (スコアカード・バッジ用) */
export const SCORE_TW = {
  eagle: { color: "text-amber-700", bgColor: "bg-amber-100" },
  birdie: { color: "text-rose-700", bgColor: "bg-rose-100" },
  par: { color: "text-sky-700", bgColor: "" },
  bogey: { color: "text-emerald-700", bgColor: "bg-emerald-100" },
  doubleBogey: { color: "text-slate-600", bgColor: "bg-slate-100" },
  triplePlus: { color: "text-slate-700", bgColor: "bg-slate-200" },
} as const;
