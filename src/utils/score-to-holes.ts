/**
 * Score[] → HoleData[] 変換ユーティリティ
 * 既存ラウンドのスコアデータを詳細入力用のHoleDataに変換する。
 * shots_detailがあればそれを使い、なければスコアから最小限のショットを合成する。
 */

import { Score, FairwayResult } from "@/types/database";
import {
  HoleData,
  Shot,
  TeeShot,
  PuttShot,
  PinPosition,
  createDefaultTeeShot,
  createDefaultApproachShot,
  createDefaultPutt,
} from "@/types/shot";
import { parseShots } from "@/utils/course-stats";

/**
 * FairwayResult → TeeShot の result/resultDirection マッピング
 */
function fairwayResultToTeeShot(fw: FairwayResult): Pick<TeeShot, "result" | "resultDirection"> {
  switch (fw) {
    case "keep":
      return { result: "fairway", resultDirection: "center" };
    case "left":
      return { result: "rough", resultDirection: "left" };
    case "right":
      return { result: "rough", resultDirection: "right" };
    default:
      return { result: "fairway", resultDirection: "center" };
  }
}

/**
 * スコアデータから最小限のショットを合成する
 * （shots_detailがnullの簡易入力データ用）
 */
function synthesizeShots(score: Score): Shot[] {
  const shots: Shot[] = [];
  const par = score.par as 3 | 4 | 5 | 6;

  // 1. ティーショット
  const tee = createDefaultTeeShot();
  const { result, resultDirection } = fairwayResultToTeeShot(score.fairway_result);
  tee.result = result;
  tee.resultDirection = resultDirection;
  shots.push(tee);

  // 2. 中間ショット（アプローチ）
  // score - putts - 1(tee) - ob(penalty strokes) = approach shot count
  const approachCount = Math.max(0, score.score - score.putts - 1 - score.ob - score.penalty);
  for (let i = 0; i < approachCount; i++) {
    const approach = createDefaultApproachShot();
    // 最後のアプローチはグリーンON
    if (i === approachCount - 1) {
      approach.result = "on-center";
    } else {
      approach.result = "miss-front";
    }
    shots.push(approach);
  }

  // 3. パットショット
  for (let i = 0; i < score.putts; i++) {
    const putt = createDefaultPutt();
    if (i < score.putts - 1) {
      // 途中パットはショート
      putt.result = "front";
    } else {
      // 最後のパットはカップイン
      putt.result = "in";
    }
    shots.push(putt);
  }

  return shots;
}

/**
 * Score配列をHoleData配列に変換する
 */
export function scoresToHoleData(scores: Score[]): HoleData[] {
  return scores
    .sort((a, b) => a.hole_number - b.hole_number)
    .map((score) => {
      // shots_detailがあればパース、なければ合成
      const existingShots = parseShots(score.shots_detail);
      const shots: Shot[] = existingShots.length > 0 ? existingShots : synthesizeShots(score);

      return {
        holeNumber: score.hole_number,
        par: score.par,
        distance: score.distance,
        pinPosition: (score.pin_position as PinPosition) ?? null,
        shots,
      };
    });
}
