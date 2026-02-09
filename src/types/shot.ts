/** クラブ種類 */
export type Club =
  | "1W"
  | "3W"
  | "5W"
  | "7W"
  | "UT2"
  | "UT3"
  | "UT4"
  | "UT5"
  | "UT6"
  | "UT7"
  | "2I"
  | "3I"
  | "4I"
  | "5I"
  | "6I"
  | "7I"
  | "8I"
  | "9I"
  | "PW"
  | "46"
  | "48"
  | "50"
  | "52"
  | "54"
  | "56"
  | "58"
  | "60"
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

/** ショット/アプローチの結果 - 8方向 + 中央 */
export type ShotResult =
  // グリーンON (9方向)
  | "on-center"       // ピン付近
  | "on-front"        // 手前
  | "on-back"         // 奥
  | "on-left"         // 左
  | "on-right"        // 右
  | "on-front-left"   // 手前左
  | "on-front-right"  // 手前右
  | "on-back-left"    // 奥左
  | "on-back-right"   // 奥右
  // グリーン外し (8方向)
  | "miss-front"
  | "miss-back"
  | "miss-left"
  | "miss-right"
  | "miss-front-left"
  | "miss-front-right"
  | "miss-back-left"
  | "miss-back-right"
  // OB/ペナルティ
  | "ob-left"
  | "ob-right"
  | "penalty-left"
  | "penalty-right";

/** パット傾斜 */
export type PuttSlope = "flat" | "uphill" | "downhill";

/** パット曲がり */
export type PuttBreak = "straight" | "slice" | "hook";

/** パットライン（後方互換のため残す） */
export type PuttLine = "straight" | "left-to-right" | "right-to-left" | "uphill" | "downhill";

/** パット結果 - 8方向 + カップイン */
export type PuttResult =
  | "in"              // カップイン
  | "front"           // ショート
  | "back"            // オーバー
  | "left"            // 左
  | "right"           // 右
  | "front-left"      // ショート左
  | "front-right"     // ショート右
  | "back-left"       // オーバー左
  | "back-right";     // オーバー右

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
  slope: PuttSlope;    // 傾斜: flat/uphill/downhill
  break: PuttBreak;    // 曲がり: straight/slice/hook
  result: PuttResult;
  rating: Rating;
  note: string;
}

/** ショット（いずれかのタイプ） */
export type Shot = TeeShot | ApproachShot | PuttShot;

/** ホールデータ */
export interface HoleData {
  holeNumber: number;
  par: 3 | 4 | 5 | 6;
  distance: number | null;
  shots: Shot[];
}

/** ラウンドデータ（詳細入力用） */
export interface DetailedRoundData {
  courseId: string | null;
  courseName: string;
  date: string;
  teeColor: string;
  teeId: string | null;
  subCourseIds: string[];
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
    result: "on-center",
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
    slope: "flat",
    break: "straight",
    result: "in",
    rating: 3,
    note: "",
  };
}

/** デフォルトのホールデータ */
export function createDefaultHole(holeNumber: number, par: 3 | 4 | 5 | 6 = 4): HoleData {
  return {
    holeNumber,
    par,
    distance: null,
    shots: [],
  };
}
