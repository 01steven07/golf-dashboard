/** クラブ種類 */
export type Club =
  | "1W"
  | "3W"
  | "5W"
  | "7W"
  | "UT"
  | "1I"
  | "2I"
  | "3I"
  | "4I"
  | "5I"
  | "6I"
  | "7I"
  | "8I"
  | "9I"
  | "PW"
  | "AW"
  | "SW"
  | "LW"
  | "PT";

/** 風向き */
export type WindDirection =
  | "none"
  | "follow"
  | "against"
  | "left"
  | "right"
  | "follow-left"
  | "follow-right"
  | "against-left"
  | "against-right";

/** 左右方向 */
export type LeftRight = "left" | "center" | "right";

/** 前後左右方向 */
export type Direction = "front" | "back" | "left" | "right" | "center";

/** 傾斜 */
export type Slope = "flat" | "uphill" | "downhill" | "left" | "right";

/** ティーショット結果 */
export type TeeResult = "fairway" | "rough" | "bunker" | "ob" | "penalty";

/** ショット/アプローチの打った場所 */
export type ShotLie = "fairway" | "left-rough" | "right-rough" | "left-bunker" | "right-bunker";

/** ショット/アプローチの結果 */
export type ShotResult =
  | "on-good"
  | "on-front"
  | "on-back"
  | "on-left"
  | "on-right"
  | "miss-front"
  | "miss-back"
  | "miss-left"
  | "miss-right"
  | "ob-left"
  | "ob-right"
  | "penalty-left"
  | "penalty-right";

/** パットライン */
export type PuttLine = "straight" | "left-to-right" | "right-to-left" | "uphill" | "downhill";

/** パット結果 */
export type PuttResult = "in" | "short" | "long" | "left" | "right";

/** 5点採点 */
export type Rating = 1 | 2 | 3 | 4 | 5;

/** ティーショット */
export interface TeeShot {
  type: "tee";
  club: Club;
  result: TeeResult;
  resultDirection: LeftRight;
  wind: WindDirection;
  rating: Rating;
  note: string;
}

/** ショット & アプローチ */
export interface ApproachShot {
  type: "approach";
  club: Club;
  lie: ShotLie;
  slope: Slope;
  result: ShotResult;
  wind: WindDirection;
  distance: number;
  rating: Rating;
  note: string;
}

/** パット */
export interface PuttShot {
  type: "putt";
  distance: number;
  line: PuttLine;
  result: PuttResult;
  rating: Rating;
  note: string;
}

/** ショット（いずれかのタイプ） */
export type Shot = TeeShot | ApproachShot | PuttShot;

/** ホールデータ */
export interface HoleData {
  holeNumber: number;
  par: 3 | 4 | 5;
  distance: number | null;
  shots: Shot[];
}

/** ラウンドデータ（詳細入力用） */
export interface DetailedRoundData {
  courseId: string | null;
  courseName: string;
  date: string;
  teeColor: string;
  holes: HoleData[];
}

/** デフォルトのティーショット */
export function createDefaultTeeShot(): TeeShot {
  return {
    type: "tee",
    club: "1W",
    result: "fairway",
    resultDirection: "center",
    wind: "none",
    rating: 3,
    note: "",
  };
}

/** デフォルトのアプローチショット */
export function createDefaultApproachShot(): ApproachShot {
  return {
    type: "approach",
    club: "7I",
    lie: "fairway",
    slope: "flat",
    result: "on-good",
    wind: "none",
    distance: 150,
    rating: 3,
    note: "",
  };
}

/** デフォルトのパット */
export function createDefaultPutt(): PuttShot {
  return {
    type: "putt",
    distance: 5,
    line: "straight",
    result: "in",
    rating: 3,
    note: "",
  };
}

/** デフォルトのホールデータ */
export function createDefaultHole(holeNumber: number, par: 3 | 4 | 5 = 4): HoleData {
  return {
    holeNumber,
    par,
    distance: null,
    shots: [],
  };
}
