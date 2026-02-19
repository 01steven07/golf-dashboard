import { describe, it, expect } from "vitest";
import {
  validateAddHalfInput,
  buildScoreRecords,
  AddHalfScoreInput,
} from "./add-half-validation";

// ======================================
// ヘルパー
// ======================================

function makeValidScore(overrides: Partial<AddHalfScoreInput> = {}): AddHalfScoreInput {
  return {
    par: 4,
    score: 4,
    putts: 2,
    fairway_result: "keep",
    ob: 0,
    bunker: 0,
    penalty: 0,
    ...overrides,
  };
}

function makeValidScores(count: number): AddHalfScoreInput[] {
  return Array.from({ length: count }, () => makeValidScore());
}

// ======================================
// A. validateAddHalfInput - 基本バリデーション
// ======================================
describe("validateAddHalfInput: 基本", () => {
  it("正常な9ホール追加 → valid", () => {
    const result = validateAddHalfInput(makeValidScores(9), 18, "OUT");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("空配列 → エラー", () => {
    const result = validateAddHalfInput([], 18, "OUT");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("スコアデータは必須");
  });

  it("空文字のcourse_label → エラー", () => {
    const result = validateAddHalfInput(makeValidScores(9), 18, "");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("コースラベル");
  });

  it("スペースのみのcourse_label → エラー", () => {
    const result = validateAddHalfInput(makeValidScores(9), 18, "  ");
    expect(result.valid).toBe(false);
  });

  it("OUTラベル → valid", () => {
    const result = validateAddHalfInput(makeValidScores(9), 18, "OUT");
    expect(result.valid).toBe(true);
  });

  it("INラベル → valid", () => {
    const result = validateAddHalfInput(makeValidScores(9), 18, "IN");
    expect(result.valid).toBe(true);
  });

  it("任意のサブコース名（東・西等） → valid", () => {
    expect(validateAddHalfInput(makeValidScores(9), 18, "東").valid).toBe(true);
    expect(validateAddHalfInput(makeValidScores(9), 18, "西").valid).toBe(true);
    expect(validateAddHalfInput(makeValidScores(9), 18, "南").valid).toBe(true);
  });
});

// ======================================
// B. validateAddHalfInput - ホール数上限
// ======================================
describe("validateAddHalfInput: ホール数上限", () => {
  it("18H + 9H = 27H → valid", () => {
    const result = validateAddHalfInput(makeValidScores(9), 18, "OUT");
    expect(result.valid).toBe(true);
  });

  it("27H + 9H = 36H → valid", () => {
    const result = validateAddHalfInput(makeValidScores(9), 27, "IN");
    expect(result.valid).toBe(true);
  });

  it("36H + 1H = 37H → エラー", () => {
    const result = validateAddHalfInput(makeValidScores(1), 36, "OUT");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("上限（36）を超えます");
  });

  it("27H + 10H = 37H → エラー", () => {
    const result = validateAddHalfInput(makeValidScores(10), 27, "OUT");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("上限（36）を超えます");
  });

  it("9H + 9H = 18H → valid", () => {
    const result = validateAddHalfInput(makeValidScores(9), 9, "IN");
    expect(result.valid).toBe(true);
  });
});

// ======================================
// C. validateAddHalfInput - 個別フィールドバリデーション
// ======================================
describe("validateAddHalfInput: フィールドバリデーション", () => {
  it("Par 2 → エラー", () => {
    const scores = [makeValidScore({ par: 2 })];
    const result = validateAddHalfInput(scores, 18, "OUT");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("ホール19");
    expect(result.error).toContain("Par");
  });

  it("Par 7 → エラー", () => {
    const scores = [makeValidScore({ par: 7 })];
    const result = validateAddHalfInput(scores, 18, "OUT");
    expect(result.valid).toBe(false);
  });

  it("スコア 0 → エラー", () => {
    const scores = [makeValidScore({ score: 0 })];
    const result = validateAddHalfInput(scores, 18, "OUT");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("スコアは1〜20");
  });

  it("スコア 21 → エラー", () => {
    const scores = [makeValidScore({ score: 21 })];
    const result = validateAddHalfInput(scores, 18, "OUT");
    expect(result.valid).toBe(false);
  });

  it("パット -1 → エラー", () => {
    const scores = [makeValidScore({ putts: -1 })];
    const result = validateAddHalfInput(scores, 18, "OUT");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("パット数は0〜10");
  });

  it("パット 11 → エラー", () => {
    const scores = [makeValidScore({ putts: 11 })];
    const result = validateAddHalfInput(scores, 18, "OUT");
    expect(result.valid).toBe(false);
  });

  it("パット > スコア → エラー", () => {
    const scores = [makeValidScore({ score: 3, putts: 4 })];
    const result = validateAddHalfInput(scores, 18, "OUT");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("パット数はスコア以下");
  });

  it("無効なフェアウェイ結果 → エラー", () => {
    const scores = [makeValidScore({ fairway_result: "miss" })];
    const result = validateAddHalfInput(scores, 18, "OUT");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("フェアウェイ");
  });

  it("OB -1 → エラー", () => {
    const scores = [makeValidScore({ ob: -1 })];
    const result = validateAddHalfInput(scores, 18, "OUT");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("OB");
  });

  it("バンカー -1 → エラー", () => {
    const scores = [makeValidScore({ bunker: -1 })];
    const result = validateAddHalfInput(scores, 18, "OUT");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("バンカー");
  });

  it("ペナルティ -1 → エラー", () => {
    const scores = [makeValidScore({ penalty: -1 })];
    const result = validateAddHalfInput(scores, 18, "OUT");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("ペナルティ");
  });

  it("2番目のスコアがエラーの場合、ホール番号が正しい", () => {
    const scores = [makeValidScore(), makeValidScore({ score: 0 })];
    const result = validateAddHalfInput(scores, 18, "OUT");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("ホール20");
  });
});

// ======================================
// D. buildScoreRecords
// ======================================
describe("buildScoreRecords", () => {
  it("18H後に9H追加 → ホール番号19-27が割り振られる", () => {
    const scores = makeValidScores(9);
    const records = buildScoreRecords(scores, "round-123", 18);

    expect(records).toHaveLength(9);
    expect(records[0].hole_number).toBe(19);
    expect(records[8].hole_number).toBe(27);
    expect(records[0].round_id).toBe("round-123");
  });

  it("27H後に9H追加 → ホール番号28-36が割り振られる", () => {
    const scores = makeValidScores(9);
    const records = buildScoreRecords(scores, "round-456", 27);

    expect(records[0].hole_number).toBe(28);
    expect(records[8].hole_number).toBe(36);
  });

  it("9H後に9H追加 → ホール番号10-18が割り振られる", () => {
    const scores = makeValidScores(9);
    const records = buildScoreRecords(scores, "round-789", 9);

    expect(records[0].hole_number).toBe(10);
    expect(records[8].hole_number).toBe(18);
  });

  it("distanceがnullの場合、nullが設定される", () => {
    const scores = [makeValidScore({ distance: undefined })];
    const records = buildScoreRecords(scores, "round-123", 18);
    expect(records[0].distance).toBeNull();
  });

  it("distanceが指定されている場合、その値が設定される", () => {
    const scores = [makeValidScore({ distance: 150 })];
    const records = buildScoreRecords(scores, "round-123", 18);
    expect(records[0].distance).toBe(150);
  });

  it("各フィールドが正しくマッピングされる", () => {
    const scores = [
      makeValidScore({
        par: 5,
        score: 6,
        putts: 3,
        fairway_result: "left",
        ob: 1,
        bunker: 2,
        penalty: 0,
        distance: 480,
      }),
    ];
    const records = buildScoreRecords(scores, "round-123", 18);

    expect(records[0]).toEqual({
      round_id: "round-123",
      hole_number: 19,
      par: 5,
      score: 6,
      putts: 3,
      fairway_result: "left",
      ob: 1,
      bunker: 2,
      penalty: 0,
      distance: 480,
    });
  });
});
