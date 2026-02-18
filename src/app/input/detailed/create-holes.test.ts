import { describe, it, expect } from "vitest";
import { createHolesFromCourse, createInitialHoles } from "@/utils/hole-builder";
import { SubCourseWithHoles } from "@/types/database";
import { HoleData, TeeShot, ApproachShot, PuttShot } from "@/types/shot";

// ======================================
// テスト用ヘルパー
// ======================================

/** 9ホール分のサブコースデータを生成 */
function makeSubCourse(
  id: string,
  name: string,
  pars: (3 | 4 | 5 | 6)[] = [4, 4, 3, 4, 5, 4, 3, 4, 5],
  distances?: Record<string, number>[]
): SubCourseWithHoles {
  return {
    id,
    course_id: "course-1",
    name,
    hole_count: pars.length,
    sort_order: 0,
    holes: pars.map((par, i) => ({
      id: `${id}-hole-${i + 1}`,
      sub_course_id: id,
      hole_number: i + 1,
      par,
      handicap: null,
      distances: distances?.[i] ?? { White: 350 + i * 10, Blue: 370 + i * 10 },
    })),
  };
}

/** ショット入力済みのHoleDataを生成 */
function makePlayedHole(holeNumber: number, par: 3 | 4 | 5 | 6 = 4): HoleData {
  const tee: TeeShot = {
    type: "tee", club: "1W", result: "fairway", resultDirection: "center",
    wind: "none", rating: 3, note: "",
  };
  const approach: ApproachShot = {
    type: "approach", club: "7I", lie: "fairway", slope: "flat",
    result: "on-center", wind: "none", distance: 150, rating: 3, note: "",
  };
  const putt: PuttShot = {
    type: "putt", distance: 5, slope: "flat", break: "straight",
    result: "in", rating: 3, note: "",
  };

  return {
    holeNumber,
    par,
    distance: 380,
    pinPosition: "center",
    shots: [tee, approach, putt],
  };
}

const OUT = makeSubCourse("sc-out", "OUT");
const IN = makeSubCourse("sc-in", "IN");
const WEST = makeSubCourse("sc-west", "西");
const ALL_SUB_COURSES = [OUT, IN, WEST];

// ======================================
// B. createHolesFromCourse テスト
// ======================================
describe("createHolesFromCourse", () => {
  // --- 基本生成 ---
  it("B-1: サブコース未選択 → デフォルト18H", () => {
    const holes = createHolesFromCourse(ALL_SUB_COURSES, [], null);
    expect(holes).toHaveLength(18);
    // createInitialHoles のデフォルトpar配列と一致
    const defaults = createInitialHoles();
    expect(holes.map((h) => h.par)).toEqual(defaults.map((h) => h.par));
  });

  it("B-2: 2サブコース(OUT+IN) → 18H生成", () => {
    const holes = createHolesFromCourse(ALL_SUB_COURSES, ["sc-out", "sc-in"], "White");
    expect(holes).toHaveLength(18);
    expect(holes[0].holeNumber).toBe(1);
    expect(holes[17].holeNumber).toBe(18);
    // distanceがWhiteティーの値になっている
    expect(holes[0].distance).toBe(350);
  });

  it("B-3: 3サブコース(9H×3) → 27H生成", () => {
    const holes = createHolesFromCourse(ALL_SUB_COURSES, ["sc-out", "sc-in", "sc-west"], "White");
    expect(holes).toHaveLength(27);
    expect(holes[26].holeNumber).toBe(27);
  });

  it("B-4: 存在しないサブコースIDを含む → 有効分のみ", () => {
    const holes = createHolesFromCourse(ALL_SUB_COURSES, ["sc-out", "invalid-id"], "White");
    expect(holes).toHaveLength(9); // OUTの9Hのみ
  });

  it("B-5: ティー名が一致しない → distance全てnull", () => {
    const holes = createHolesFromCourse(ALL_SUB_COURSES, ["sc-out"], "Gold");
    expect(holes).toHaveLength(9);
    holes.forEach((h) => expect(h.distance).toBeNull());
  });

  it("B-10: existingHoles=undefined（初回選択）→ 全ホール新規作成", () => {
    const holes = createHolesFromCourse(ALL_SUB_COURSES, ["sc-out"], "White");
    holes.forEach((h) => expect(h.shots).toHaveLength(0));
  });

  it("B-11: par範囲外 → デフォルト4にフォールバック", () => {
    const badSubCourse = makeSubCourse("sc-bad", "BAD", [2 as 3, 7 as 4]);
    const holes = createHolesFromCourse([badSubCourse], ["sc-bad"], null);
    expect(holes[0].par).toBe(4);
    expect(holes[1].par).toBe(4);
  });

  // --- データ保持 ---
  it("B-6: サブコース追加 → 既存ホールのshots保持", () => {
    // 18H分のショットデータあり
    const existingHoles = Array.from({ length: 18 }, (_, i) =>
      makePlayedHole(i + 1, OUT.holes[i % 9].par)
    );

    // 3つ目のサブコース追加
    const holes = createHolesFromCourse(
      ALL_SUB_COURSES,
      ["sc-out", "sc-in", "sc-west"],
      "White",
      existingHoles
    );

    expect(holes).toHaveLength(27);
    // H1-18: ショットデータ保持
    for (let i = 0; i < 18; i++) {
      expect(holes[i].shots).toHaveLength(3);
      expect(holes[i].shots[0].type).toBe("tee");
    }
    // H19-27: 新規（ショット空）
    for (let i = 18; i < 27; i++) {
      expect(holes[i].shots).toHaveLength(0);
    }
  });

  it("B-7: サブコース削除 → 残りホールのshots保持", () => {
    // 27H分のデータ
    const existingHoles = Array.from({ length: 27 }, (_, i) =>
      makePlayedHole(i + 1)
    );

    // 3つ目を削除 → 18Hに
    const holes = createHolesFromCourse(
      ALL_SUB_COURSES,
      ["sc-out", "sc-in"],
      "White",
      existingHoles
    );

    expect(holes).toHaveLength(18);
    for (let i = 0; i < 18; i++) {
      expect(holes[i].shots).toHaveLength(3);
    }
  });

  it("B-8: ティー変更 → shots保持、distanceだけ更新", () => {
    const existingHoles = Array.from({ length: 9 }, (_, i) =>
      makePlayedHole(i + 1, OUT.holes[i].par)
    );

    // White → Blue に変更
    const holes = createHolesFromCourse(
      ALL_SUB_COURSES,
      ["sc-out"],
      "Blue",
      existingHoles
    );

    expect(holes).toHaveLength(9);
    for (let i = 0; i < 9; i++) {
      // ショットデータ保持
      expect(holes[i].shots).toHaveLength(3);
      // distance がBlueに更新
      expect(holes[i].distance).toBe(370 + i * 10);
    }
  });

  it("B-9: サブコース並べ替え → holeNumber振り直し、shots引き継ぎ", () => {
    const existingHoles = Array.from({ length: 18 }, (_, i) => {
      const hole = makePlayedHole(i + 1);
      hole.shots[0] = {
        ...(hole.shots[0] as TeeShot),
        note: `hole-${i + 1}`,
      };
      return hole;
    });

    // OUT+IN → IN+OUT に並べ替え
    const holes = createHolesFromCourse(
      ALL_SUB_COURSES,
      ["sc-in", "sc-out"],
      "White",
      existingHoles
    );

    expect(holes).toHaveLength(18);
    // holeNumber は1から振り直されている
    expect(holes[0].holeNumber).toBe(1);
    expect(holes[17].holeNumber).toBe(18);
    // 元のholeNumber=1のデータがholeNumber=1に入っている（holeNumberで照合するため）
    expect((holes[0].shots[0] as TeeShot).note).toBe("hole-1");
  });

  it("B-12: 1サブコースのみ選択 → 9H生成", () => {
    const holes = createHolesFromCourse(ALL_SUB_COURSES, ["sc-out"], "White");
    expect(holes).toHaveLength(9);
    expect(holes[0].holeNumber).toBe(1);
    expect(holes[8].holeNumber).toBe(9);
  });

  it("B-13: 同じサブコースを2回選択（重複許可）→ 18H", () => {
    const holes = createHolesFromCourse(ALL_SUB_COURSES, ["sc-out", "sc-out"], "White");
    expect(holes).toHaveLength(18);
  });

  it("B-14: ティーnull → distance全てnull", () => {
    const holes = createHolesFromCourse(ALL_SUB_COURSES, ["sc-out"], null);
    expect(holes).toHaveLength(9);
    holes.forEach((h) => expect(h.distance).toBeNull());
  });

  it("B-15: サブコース追加時にpinPositionも保持される", () => {
    const existingHoles = Array.from({ length: 9 }, (_, i) => {
      const hole = makePlayedHole(i + 1);
      hole.pinPosition = "back-left";
      return hole;
    });

    const holes = createHolesFromCourse(
      ALL_SUB_COURSES,
      ["sc-out", "sc-in"],
      "White",
      existingHoles
    );

    // H1-9: pinPosition保持
    for (let i = 0; i < 9; i++) {
      expect(holes[i].pinPosition).toBe("back-left");
    }
    // H10-18: 新規（null）
    for (let i = 9; i < 18; i++) {
      expect(holes[i].pinPosition).toBeNull();
    }
  });

  it("B-16: 途中まで入力済み（H1-5のみshot有り） + サブコース追加 → H1-5保持", () => {
    const existingHoles: HoleData[] = [];
    for (let i = 0; i < 9; i++) {
      if (i < 5) {
        existingHoles.push(makePlayedHole(i + 1, OUT.holes[i].par));
      } else {
        existingHoles.push({
          holeNumber: i + 1,
          par: OUT.holes[i].par,
          distance: 380,
          pinPosition: null,
          shots: [],
        });
      }
    }

    const holes = createHolesFromCourse(
      ALL_SUB_COURSES,
      ["sc-out", "sc-in"],
      "White",
      existingHoles
    );

    expect(holes).toHaveLength(18);
    // H1-5: ショットあり
    for (let i = 0; i < 5; i++) {
      expect(holes[i].shots.length).toBeGreaterThan(0);
    }
    // H6-18: ショット空
    for (let i = 5; i < 18; i++) {
      expect(holes[i].shots).toHaveLength(0);
    }
  });
});

// ======================================
// createInitialHoles テスト
// ======================================
describe("createInitialHoles", () => {
  it("18ホール生成", () => {
    const holes = createInitialHoles();
    expect(holes).toHaveLength(18);
  });

  it("holeNumber が 1-18 の連番", () => {
    const holes = createInitialHoles();
    holes.forEach((h, i) => expect(h.holeNumber).toBe(i + 1));
  });

  it("全ホールの shots が空", () => {
    const holes = createInitialHoles();
    holes.forEach((h) => expect(h.shots).toHaveLength(0));
  });

  it("par3, par4, par5 が含まれる", () => {
    const holes = createInitialHoles();
    const pars = new Set(holes.map((h) => h.par));
    expect(pars.has(3)).toBe(true);
    expect(pars.has(4)).toBe(true);
    expect(pars.has(5)).toBe(true);
  });
});
