/**
 * Score[] → HoleData[] 変換ユーティリティ
 * 既存ラウンドのスコアデータを詳細入力用のHoleDataに変換する。
 * shots_detailがあればそれを使い、なければショットは空（ユーザーが必要に応じて追加）。
 */

import { Score } from "@/types/database";
import { HoleData, PinPosition } from "@/types/shot";
import { parseShots } from "@/utils/course-stats";

/**
 * Score配列をHoleData配列に変換する
 * shots_detailがある場合のみショットを復元し、
 * ない場合（簡易入力）はショットを空にする。
 * ショットが空のホールは保存時にスキップされ、既存スコアが維持される。
 */
export function scoresToHoleData(scores: Score[]): HoleData[] {
  return scores
    .sort((a, b) => a.hole_number - b.hole_number)
    .map((score) => ({
      holeNumber: score.hole_number,
      par: score.par,
      distance: score.distance,
      pinPosition: (score.pin_position as PinPosition) ?? null,
      shots: parseShots(score.shots_detail),
    }));
}
