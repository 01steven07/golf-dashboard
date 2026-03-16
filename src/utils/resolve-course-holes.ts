import { SubCourseWithHoles } from "@/types/database";

/**
 * 選択されたサブコースのID順にホールを並べ、
 * hole_number → course_hole_id のマッピングを返す。
 * コースマスタ未登録の場合は空マップを返す。
 */
export function buildCourseHoleIdMap(
  subCourses: SubCourseWithHoles[],
  selectedSubCourseIds: string[],
  holeOffset: number = 0
): Map<number, string> {
  const map = new Map<number, string>();
  let holeNum = holeOffset + 1;

  for (const scId of selectedSubCourseIds) {
    const sc = subCourses.find((s) => s.id === scId);
    if (!sc) continue;

    const sortedHoles = [...sc.holes].sort((a, b) => a.hole_number - b.hole_number);
    for (const h of sortedHoles) {
      map.set(holeNum, h.id);
      holeNum++;
    }
  }

  return map;
}
