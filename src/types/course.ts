/** スクレイピングで取得したホールデータ */
export interface ScrapedHoleData {
  hole_number: number;
  par: number;
  handicap: number | null;
  distances: Record<string, number>;
}

/** スクレイピングで取得したサブコースデータ */
export interface ScrapedSubCourse {
  name: string;
  holes: ScrapedHoleData[];
}

/** スクレイピング結果 */
export interface CourseScrapingResult {
  course_name: string;
  pref: string | null;
  green_types: string[];
  tees: string[];
  sub_courses: ScrapedSubCourse[];
}

/** コース登録フォームのティーデータ */
export interface TeeFormData {
  id?: string;
  name: string;
  color: string;
  sort_order: number;
}

/** コース登録フォームのホールデータ */
export interface HoleFormData {
  id?: string;
  hole_number: number;
  par: 3 | 4 | 5 | 6;
  handicap: number | null;
  distances: Record<string, number>;
}

/** コース登録フォームのサブコースデータ */
export interface SubCourseFormData {
  id?: string;
  name: string;
  hole_count: number;
  sort_order: number;
  holes: HoleFormData[];
}

/** コース登録フォーム全体のデータ */
export interface CourseFormData {
  name: string;
  pref: string;
  source_url: string;
  green_types: string[];
  tees: TeeFormData[];
  sub_courses: SubCourseFormData[];
}
