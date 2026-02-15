import { HoleData, TeeShot, ApproachShot } from "@/types/shot";
import { FairwayResult, PinPosition } from "@/types/database";

/** scores テーブルに挿入する1行分のデータ */
export interface AggregatedScore {
  hole_number: number;
  par: number;
  distance: number | null;
  score: number;
  putts: number;
  fairway_result: FairwayResult;
  ob: number;
  bunker: number;
  penalty: number;
  pin_position: PinPosition | null;
  shots_detail: unknown[];
}

/**
 * ホールのスコアを計算（ショット数 + OB罰打 + ペナルティ罰打）
 */
export function getHoleScore(hole: HoleData): number {
  return hole.shots.length + countOB(hole) + countPenalty(hole);
}

/**
 * HoleData（ショット配列付き）を scores テーブルのフラットレコードに変換する
 */
export function aggregateHoleData(hole: HoleData): AggregatedScore {
  const score = getHoleScore(hole);
  const putts = hole.shots.filter((s) => s.type === "putt").length;
  const fairway_result = deriveFairwayResult(hole);
  const ob = countOB(hole);
  const bunker = countBunker(hole);
  const penalty = countPenalty(hole);

  return {
    hole_number: hole.holeNumber,
    par: hole.par,
    distance: hole.distance,
    score,
    putts,
    fairway_result,
    ob,
    bunker,
    penalty,
    pin_position: hole.pinPosition,
    shots_detail: hole.shots,
  };
}

/**
 * フェアウェイ結果を算出
 * - Par 3 → 常に keep（フェアウェイキープはPar4+の概念）
 * - ティーショットの result + resultDirection から判定
 */
function deriveFairwayResult(hole: HoleData): FairwayResult {
  if (hole.par === 3) return "keep";

  const teeShot = hole.shots.find((s) => s.type === "tee") as TeeShot | undefined;
  if (!teeShot) return "keep";

  switch (teeShot.result) {
    case "fairway":
      return "keep";
    case "rough":
    case "bunker":
    case "penalty":
      return teeShot.resultDirection === "right" ? "right" : "left";
    case "ob":
      return teeShot.resultDirection === "right" ? "right" : "left";
    default:
      return "keep";
  }
}

/** OB数を集計: TeeShot(result=ob) + ApproachShot(result=ob-*) */
function countOB(hole: HoleData): number {
  let count = 0;
  for (const shot of hole.shots) {
    if (shot.type === "tee" && shot.result === "ob") {
      count++;
    } else if (shot.type === "approach") {
      const approach = shot as ApproachShot;
      if (approach.result === "ob-left" || approach.result === "ob-right") {
        count++;
      }
    }
  }
  return count;
}

/** バンカー数を集計: ApproachShot(lie=left-bunker or right-bunker) */
function countBunker(hole: HoleData): number {
  let count = 0;
  for (const shot of hole.shots) {
    if (shot.type === "approach") {
      const approach = shot as ApproachShot;
      if (approach.lie === "left-bunker" || approach.lie === "right-bunker") {
        count++;
      }
    }
  }
  return count;
}

/** ペナルティ数を集計: TeeShot(result=penalty) + ApproachShot(result=penalty-*) */
function countPenalty(hole: HoleData): number {
  let count = 0;
  for (const shot of hole.shots) {
    if (shot.type === "tee" && shot.result === "penalty") {
      count++;
    } else if (shot.type === "approach") {
      const approach = shot as ApproachShot;
      if (approach.result === "penalty-left" || approach.result === "penalty-right") {
        count++;
      }
    }
  }
  return count;
}
