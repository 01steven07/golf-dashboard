import { HoleData, createDefaultHole } from "@/types/shot";
import { SubCourseWithHoles } from "@/types/database";

// 初期状態：18ホール分
const defaultPars: (3 | 4 | 5)[] = [4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5];

export function createInitialHoles(): HoleData[] {
  return defaultPars.map((par, i) => createDefaultHole(i + 1, par));
}

/** コースデータからホールを生成（selectedSubCourseIdsの順序を尊重） */
export function createHolesFromCourse(
  subCourses: SubCourseWithHoles[],
  selectedSubCourseIds: string[],
  teeName: string | null,
  existingHoles?: HoleData[]
): HoleData[] {
  const holes: HoleData[] = [];
  let holeNum = 1;
  for (const scId of selectedSubCourseIds) {
    const sc = subCourses.find((s) => s.id === scId);
    if (!sc) continue;
    for (const h of sc.holes) {
      const distance = teeName && h.distances[teeName] ? h.distances[teeName] : null;
      const par = (h.par >= 3 && h.par <= 6 ? h.par : 4) as 3 | 4 | 5 | 6;

      // 既存データがあればそれを引き継ぐ（holeNumberだけ振り直す）
      const existing = existingHoles?.find((e) => e.holeNumber === holeNum);
      if (existing) {
        holes.push({ ...existing, holeNumber: holeNum, par, distance });
      } else {
        const newHole = createDefaultHole(holeNum, par);
        newHole.distance = distance;
        holes.push(newHole);
      }
      holeNum++;
    }
  }
  return holes.length > 0 ? holes : createInitialHoles();
}
