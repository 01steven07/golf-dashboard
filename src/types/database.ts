export type MemberRole = "admin" | "member";

export type Gender = "male" | "female" | "other";

export type TeeColor = "Blue" | "White" | "Red" | "Gold" | "Black";

export type PreferredTee = "black" | "blue" | "white" | "red" | "green";

/** フェアウェイ結果: keep=キープ, left=左ミス, right=右ミス */
export type FairwayResult = "keep" | "left" | "right";

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
