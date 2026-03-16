/**
 * 同期版: すでに取得済みのサブコース名マップからラベルを解決する。
 * クライアントサイドで一括取得した結果を使う場合に利用。
 */
export function resolveSectionLabels(
  playedSubCourseIds: string[],
  subCourseNameMap: Map<string, string>
): string[] {
  return playedSubCourseIds.map((id) => subCourseNameMap.get(id) ?? "???");
}

/**
 * 旧カラムからフォールバックでセクションラベルを生成する。
 * played_sub_course_ids が空の場合に使用。
 */
export function getFallbackSectionLabels(
  outCourseName: string | null,
  inCourseName: string | null,
  extCourseLabels: string[] = []
): string[] {
  return [
    outCourseName || "OUT",
    inCourseName || "IN",
    ...extCourseLabels,
  ];
}
