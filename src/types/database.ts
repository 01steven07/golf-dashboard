export type MemberRole = "admin" | "member";

export type TeeColor = "Blue" | "White" | "Red" | "Gold" | "Black";

/** フェアウェイ結果: keep=キープ, left=左ミス, right=右ミス */
export type FairwayResult = "keep" | "left" | "right";

export interface Member {
  id: string;
  name: string;
  grade: number;
  role: MemberRole;
}

/** DB上のMember（pin_hash含む、APIでは使用しない） */
export interface MemberWithHash extends Member {
  pin_hash: string;
}

export interface Course {
  id: string;
  name: string;
  pref: string | null;
}

export interface Round {
  id: string;
  member_id: string;
  course_id: string;
  date: string;
  tee_color: TeeColor;
  weather: string | null;
  image_url: string | null;
}

export interface Score {
  id: string;
  round_id: string;
  hole_number: number;
  par: 3 | 4 | 5;
  distance: number | null;
  score: number;
  putts: number;
  fairway_result: FairwayResult;
  ob: number;
  bunker: number;
  penalty: number;
}

/** Round with nested scores and course info */
export interface RoundWithDetails extends Round {
  course: Course;
  scores: Score[];
}

/** Aggregated stats for ranking (based on last 5 rounds) */
export interface MemberStats {
  member_id: string;
  member_name: string;
  round_count: number;
  avg_score: number;
  avg_putts: number;
  gir_rate: number;
  fairway_keep_rate: number;
  avg_birdies: number;
  scramble_rate: number;
}
