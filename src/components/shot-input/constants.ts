import { Club, WindDirection, LeftRight, Direction, Slope, TeeResult, ShotLie, ShotResult, PuttLine, PuttResult } from "@/types/shot";

export const CLUBS: { value: Club; label: string }[] = [
  { value: "1W", label: "1W" },
  { value: "3W", label: "3W" },
  { value: "5W", label: "5W" },
  { value: "7W", label: "7W" },
  { value: "UT", label: "UT" },
  { value: "1I", label: "1I" },
  { value: "2I", label: "2I" },
  { value: "3I", label: "3I" },
  { value: "4I", label: "4I" },
  { value: "5I", label: "5I" },
  { value: "6I", label: "6I" },
  { value: "7I", label: "7I" },
  { value: "8I", label: "8I" },
  { value: "9I", label: "9I" },
  { value: "PW", label: "PW" },
  { value: "AW", label: "AW" },
  { value: "SW", label: "SW" },
  { value: "LW", label: "LW" },
  { value: "PT", label: "PT" },
];

export const WIND_DIRECTIONS: { value: WindDirection; label: string }[] = [
  { value: "none", label: "無風" },
  { value: "follow", label: "フォロー" },
  { value: "against", label: "アゲンスト" },
  { value: "left", label: "左から" },
  { value: "right", label: "右から" },
  { value: "follow-left", label: "フォロー左" },
  { value: "follow-right", label: "フォロー右" },
  { value: "against-left", label: "アゲ左" },
  { value: "against-right", label: "アゲ右" },
];

export const LEFT_RIGHT: { value: LeftRight; label: string }[] = [
  { value: "left", label: "左" },
  { value: "center", label: "中央" },
  { value: "right", label: "右" },
];

export const DIRECTIONS: { value: Direction; label: string }[] = [
  { value: "front", label: "手前" },
  { value: "back", label: "奥" },
  { value: "left", label: "左" },
  { value: "right", label: "右" },
  { value: "center", label: "中央" },
];

export const SLOPES: { value: Slope; label: string }[] = [
  { value: "flat", label: "フラット" },
  { value: "uphill", label: "つま先上がり" },
  { value: "downhill", label: "つま先下がり" },
  { value: "left", label: "左足上がり" },
  { value: "right", label: "左足下がり" },
];

export const TEE_RESULTS: { value: TeeResult; label: string }[] = [
  { value: "fairway", label: "FW" },
  { value: "rough", label: "ラフ" },
  { value: "bunker", label: "バンカー" },
  { value: "ob", label: "OB" },
  { value: "penalty", label: "ペナ" },
];

export const SHOT_LIES: { value: ShotLie; label: string }[] = [
  { value: "fairway", label: "FW" },
  { value: "left-rough", label: "左ラフ" },
  { value: "right-rough", label: "右ラフ" },
  { value: "left-bunker", label: "左バンカー" },
  { value: "right-bunker", label: "右バンカー" },
];

export const SHOT_RESULTS: { value: ShotResult; label: string }[] = [
  // グリーンON (9方向)
  { value: "on-center", label: "ON ピン付近" },
  { value: "on-front", label: "ON 手前" },
  { value: "on-back", label: "ON 奥" },
  { value: "on-left", label: "ON 左" },
  { value: "on-right", label: "ON 右" },
  { value: "on-front-left", label: "ON 手前左" },
  { value: "on-front-right", label: "ON 手前右" },
  { value: "on-back-left", label: "ON 奥左" },
  { value: "on-back-right", label: "ON 奥右" },
  // グリーン外し (8方向)
  { value: "miss-front", label: "外し 手前" },
  { value: "miss-back", label: "外し 奥" },
  { value: "miss-left", label: "外し 左" },
  { value: "miss-right", label: "外し 右" },
  { value: "miss-front-left", label: "外し 手前左" },
  { value: "miss-front-right", label: "外し 手前右" },
  { value: "miss-back-left", label: "外し 奥左" },
  { value: "miss-back-right", label: "外し 奥右" },
  // OB/ペナルティ
  { value: "ob-left", label: "OB 左" },
  { value: "ob-right", label: "OB 右" },
  { value: "penalty-left", label: "ペナ 左" },
  { value: "penalty-right", label: "ペナ 右" },
];

export const PUTT_LINES: { value: PuttLine; label: string }[] = [
  { value: "straight", label: "ストレート" },
  { value: "left-to-right", label: "スライス" },
  { value: "right-to-left", label: "フック" },
  { value: "uphill", label: "上り" },
  { value: "downhill", label: "下り" },
];

export const PUTT_RESULTS: { value: PuttResult; label: string }[] = [
  { value: "in", label: "カップイン" },
  { value: "front", label: "ショート" },
  { value: "back", label: "オーバー" },
  { value: "left", label: "左" },
  { value: "right", label: "右" },
  { value: "front-left", label: "ショート左" },
  { value: "front-right", label: "ショート右" },
  { value: "back-left", label: "オーバー左" },
  { value: "back-right", label: "オーバー右" },
];

export const RATINGS = [1, 2, 3, 4, 5] as const;
