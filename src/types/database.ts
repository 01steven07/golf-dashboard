export type MemberRole = "admin" | "member";

export type Gender = "male" | "female" | "other";

export type TeeColor = "Blue" | "White" | "Red" | "Gold" | "Black";

export type PreferredTee = "black" | "blue" | "white" | "red" | "green";

/** フェアウェイ結果: keep=キープ, left=左ミス, right=右ミス */
export type FairwayResult = "keep" | "left" | "right";

/** ピン位置（グリーン9分割） */
export type PinPosition =
  | "front-left"
  | "front-center"
  | "front-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "back-left"
  | "back-center"
  | "back-right";

/** クラブ種類（キャディバッグに入れるクラブ） */
export type ClubType =
  | "1W" | "3W" | "5W" | "7W"
  | "UT2" | "UT3" | "UT4" | "UT5" | "UT6" | "UT7"
  | "2I" | "3I" | "4I" | "5I" | "6I" | "7I" | "8I" | "9I"
  | "PW"
  | "46" | "48" | "50" | "52" | "54" | "56" | "58" | "60"
  | "PT";

export interface Member {
  id: string;
  name: string;
  grade: number;
  role: MemberRole;
  clubs: ClubType[];
  gender: Gender;
  preferred_tee: PreferredTee;
}

/** DB上のMember（pin_hash含む、APIでは使用しない） */
export interface MemberWithHash extends Member {
  pin_hash: string;
}

export interface Course {
  id: string;
  name: string;
  pref: string | null;
  green_types: string[] | null;
  source_url: string | null;
}

export interface CourseTee {
  id: string;
  course_id: string;
  name: string;
  color: string | null;
  sort_order: number;
}

export interface CourseSubCourse {
  id: string;
  course_id: string;
  name: string;
  hole_count: number;
  sort_order: number;
}

export interface CourseHole {
  id: string;
  sub_course_id: string;
  hole_number: number;
  par: 3 | 4 | 5 | 6;
  handicap: number | null;
  distances: Record<string, number>;
}

export interface SubCourseWithHoles extends CourseSubCourse {
  holes: CourseHole[];
}

export interface CourseWithDetails extends Course {
  tees: CourseTee[];
  sub_courses: SubCourseWithHoles[];
}

export interface Round {
  id: string;
  member_id: string;
  course_id: string | null;
  date: string;
  tee_color: TeeColor;
  weather: string | null;
  image_url: string | null;
  out_course_name: string | null;
  in_course_name: string | null;
}

export interface Score {
  id: string;
  round_id: string;
  hole_number: number;
  par: 3 | 4 | 5 | 6;
  distance: number | null;
  score: number;
  putts: number;
  fairway_result: FairwayResult;
  ob: number;
  bunker: number;
  penalty: number;
  pin_position: PinPosition | null;
  shots_detail: unknown[] | null;
}

/** Round with nested scores and course info */
export interface RoundWithDetails extends Round {
  course: Course | null;
  scores: Score[];
}

/** Aggregated stats for ranking (based on last 5 rounds) */
export interface MemberStats {
  member_id: string;
  member_name: string;
  round_count: number;
  // Core stats
  avg_score: number;
  avg_putts: number;
  gir_rate: number;
  fairway_keep_rate: number;
  avg_birdies: number;
  scramble_rate: number;
  // Scoring stats
  par3_avg: number;
  par4_avg: number;
  par5_avg: number;
  bounce_back_rate: number;
  bogey_avoidance: number;
  double_bogey_avoidance: number;
  // Putting stats
  putts_per_gir: number;
  three_putt_avoidance: number;
  one_putt_rate: number;
  // Shot stats
  gir_from_fairway: number;
  gir_from_rough: number;
  sand_save_rate: number | null;
  avg_driving_distance: number | null;
  // パット距離別カップイン率 (requires shots_detail)
  putt_make_1m: number | null;
  putt_make_1_2m: number | null;
  putt_make_2_5m: number | null;
  putt_make_5_10m: number | null;
  putt_make_10m_plus: number | null;
  // 距離別パーオン率 (requires shots_detail)
  gir_dist_100: number | null;
  gir_dist_100_125: number | null;
  gir_dist_125_150: number | null;
  gir_dist_150_175: number | null;
  gir_dist_175_200: number | null;
  gir_dist_200_plus: number | null;
}

/** 距離帯別の成功率データ */
export interface DistanceBucket {
  label: string;
  rate: number;
  count: number;
}

/** Detailed stats requiring shots_detail data */
export interface DetailedMemberStats {
  sand_save_rate: number | null;
  avg_driving_distance: number | null;
  make_pct_by_distance: DistanceBucket[];
  gir_by_distance: DistanceBucket[];
}
