import { describe, it, expect } from "vitest";
import { validateScores, ScoreInput } from "./score-validation";

/** ヘルパー: 指定ホール数分の正常なスコアデータを生成 */
function makeValidScores(count: number): ScoreInput[] {
  return Array.from({ length: count }, (_, i) => ({
    hole_number: i + 1,
    par: 4,
    score: 4,
    putts: 2,
    ob: 0,
    bunker: 0,
    penalty: 0,
  }));
}

// ======================================
// A. ホール数バリデーション
// ======================================
describe("validateScores: ホール数", () => {
  it("A-1: 9H → エラーなし", () => {
    expect(validateScores(makeValidScores(9))).toHaveLength(0);
  });

  it("A-2: 18H → エラーなし", () => {
    expect(validateScores(makeValidScores(18))).toHaveLength(0);
  });

  it("A-3: 27H → エラーなし", () => {
    expect(validateScores(makeValidScores(27))).toHaveLength(0);
  });

  it("A-4: 36H → エラーなし", () => {
    expect(validateScores(makeValidScores(36))).toHaveLength(0);
  });

  it("A-5: 1H（日没等の途中終了）→ エラーなし", () => {
    expect(validateScores(makeValidScores(1))).toHaveLength(0);
  });

  it("A-6: 14H（日没で途中終了）→ エラーなし", () => {
    expect(validateScores(makeValidScores(14))).toHaveLength(0);
  });

  it("A-7: 0H → エラー", () => {
    const errors = validateScores([]);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("holes");
  });

  it("A-8: 37H（上限超過）→ エラー", () => {
    const errors = validateScores(makeValidScores(37));
    expect(errors.some((e) => e.field === "holes")).toBe(true);
  });
});

// ======================================
// A-ext. 各フィールドの個別バリデーション
// ======================================
describe("validateScores: フィールド別", () => {
  function single(overrides: Partial<ScoreInput>): ScoreInput[] {
    return [
      { hole_number: 1, par: 4, score: 4, putts: 2, ob: 0, bunker: 0, penalty: 0, ...overrides },
    ];
  }

  // --- par ---
  it("par=3 → OK", () => {
    expect(validateScores(single({ par: 3 }))).toHaveLength(0);
  });

  it("par=6 → OK", () => {
    expect(validateScores(single({ par: 6 }))).toHaveLength(0);
  });

  it("par=2 → エラー", () => {
    const errors = validateScores(single({ par: 2 }));
    expect(errors.some((e) => e.field === "par")).toBe(true);
  });

  it("par=7 → エラー", () => {
    const errors = validateScores(single({ par: 7 }));
    expect(errors.some((e) => e.field === "par")).toBe(true);
  });

  // --- score ---
  it("score=1 → OK", () => {
    expect(validateScores(single({ score: 1, putts: 0 }))).toHaveLength(0);
  });

  it("score=20 → OK", () => {
    expect(validateScores(single({ score: 20 }))).toHaveLength(0);
  });

  it("score=0 → エラー", () => {
    const errors = validateScores(single({ score: 0, putts: 0 }));
    expect(errors.some((e) => e.field === "score")).toBe(true);
  });

  it("score=21 → エラー", () => {
    const errors = validateScores(single({ score: 21 }));
    expect(errors.some((e) => e.field === "score")).toBe(true);
  });

  // --- putts ---
  it("putts=0（チップイン）→ OK", () => {
    expect(validateScores(single({ putts: 0 }))).toHaveLength(0);
  });

  it("putts=-1 → エラー", () => {
    const errors = validateScores(single({ putts: -1 }));
    expect(errors.some((e) => e.field === "putts")).toBe(true);
  });

  it("putts > score → エラー", () => {
    const errors = validateScores(single({ score: 4, putts: 5 }));
    expect(errors.some((e) => e.field === "putts")).toBe(true);
  });

  it("putts === score → OK", () => {
    expect(validateScores(single({ score: 4, putts: 4 }))).toHaveLength(0);
  });

  // --- ob, bunker, penalty ---
  it("ob=-1 → エラー", () => {
    expect(validateScores(single({ ob: -1 })).some((e) => e.field === "ob")).toBe(true);
  });

  it("bunker=-1 → エラー", () => {
    expect(validateScores(single({ bunker: -1 })).some((e) => e.field === "bunker")).toBe(true);
  });

  it("penalty=-1 → エラー", () => {
    expect(validateScores(single({ penalty: -1 })).some((e) => e.field === "penalty")).toBe(true);
  });

  // --- distance ---
  it("distance=null → OK（未設定）", () => {
    expect(validateScores(single({ distance: null }))).toHaveLength(0);
  });

  it("distance=undefined → OK（未設定）", () => {
    expect(validateScores(single({ distance: undefined }))).toHaveLength(0);
  });

  it("distance=1 → OK（下限）", () => {
    expect(validateScores(single({ distance: 1 }))).toHaveLength(0);
  });

  it("distance=999 → OK（上限: Par6対応）", () => {
    expect(validateScores(single({ distance: 999 }))).toHaveLength(0);
  });

  it("distance=900 → OK（Par6の現実的な距離）", () => {
    expect(validateScores(single({ distance: 900 }))).toHaveLength(0);
  });

  it("distance=1000 → エラー（上限超過）", () => {
    const errors = validateScores(single({ distance: 1000 }));
    expect(errors.some((e) => e.field === "distance")).toBe(true);
  });

  it("distance=0 → エラー（下限未満）", () => {
    const errors = validateScores(single({ distance: 0 }));
    expect(errors.some((e) => e.field === "distance")).toBe(true);
  });

  it("distance=-100 → エラー（負の値）", () => {
    const errors = validateScores(single({ distance: -100 }));
    expect(errors.some((e) => e.field === "distance")).toBe(true);
  });

  // --- 複数エラーの複合 ---
  it("複数フィールドにエラーがあると全て返る", () => {
    const errors = validateScores(single({ par: 2, score: 0, putts: -1 }));
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
