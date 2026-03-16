import { supabase } from "@/lib/supabase";

/**
 * played_sub_course_ids からサブコース名を取得してセクションラベルを返す。
 * 取得に失敗した場合や空配列の場合は null を返す（フォールバック用）。
 */
export async function fetchSectionLabelsFromIds(
  playedSubCourseIds: string[]
): Promise<string[] | null> {
  if (!playedSubCourseIds || playedSubCourseIds.length === 0) {
    return null;
  }

  const { data, error } = await supabase
    .from("course_sub_courses")
    .select("id, name")
    .in("id", playedSubCourseIds);

  if (error || !data) {
    return null;
  }

  // played_sub_course_ids の順番を維持
  const nameMap = new Map(data.map((d) => [d.id, d.name]));
  const labels = playedSubCourseIds.map((id) => nameMap.get(id) ?? `H?`);

  return labels;
}
