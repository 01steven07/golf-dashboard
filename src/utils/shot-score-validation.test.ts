import { describe, it, expect } from "vitest";
import {
  computeScoreFromShots,
  detectShotScoreMismatch,
} from "./shot-score-validation";
import {
  Shot,
  TeeShot,
  ApproachShot,
  PuttShot,
  createDefaultTeeShot,
  createDefaultApproachShot,
  createDefaultPutt,
} from "@/types/shot";

// ======================================
// ヘルパー: ショット生成
// ======================================
function tee(overrides?: Partial<TeeShot>): TeeShot {
  return { ...createDefaultTeeShot(), ...overrides };
}
function approach(overrides?: Partial<ApproachShot>): ApproachShot {
  return { ...createDefaultApproachShot(), ...overrides };
}
function putt(overrides?: Partial<PuttShot>): PuttShot {
  return { ...createDefaultPutt(), ...overrides };
}

/** Par4 ボギー: tee → approach → putt → putt (4打 + 0OB + 0ペナ = 4, パット2) */
function par4Bogey(): Shot[] {
  return [tee(), approach(), putt({ result: "front" }), putt()];
}

/** Par4 パー: tee → approach → putt (3打→あれ？) いや、tee→approach→putt→putt で par なら score=4 */
/** 正確にはPar4のパーは tee + approach + 2putt = 4打 */
function par4Par(): Shot[] {
  return [tee(), approach(), putt({ result: "front" }), putt()];
}

/** Par3 パー: tee → putt → putt = 3打, パット2 */
function par3Par(): Shot[] {
  return [tee({ distance: 150 }), putt({ result: "front" }), putt()];
}

/** Par5 パー: tee → approach → approach → putt → putt = 5打, パット2 */
function par5Par(): Shot[] {
  return [tee(), approach(), approach(), putt({ result: "front" }), putt()];
}

// ======================================
// A. computeScoreFromShots
// ======================================
describe("computeScoreFromShots", () => {
  it("空のショット配列の場合 → スコア=OB+ペナ, パット=0", () => {
    const result = computeScoreFromShots([], 0, 0);
    expect(result.computedScore).toBe(0);
    expect(result.computedPutts).toBe(0);
    expect(result.totalShots).toBe(0);
  });

  it("Par4パー: tee+approach+putt+putt = 4打, OB0, ペナ0 → スコア4", () => {
    const result = computeScoreFromShots(par4Par(), 0, 0);
    expect(result.computedScore).toBe(4);
    expect(result.computedPutts).toBe(2);
    expect(result.totalShots).toBe(4);
    expect(result.teeShots).toBe(1);
    expect(result.approachShots).toBe(1);
    expect(result.puttShots).toBe(2);
  });

  it("Par3パー: tee+putt+putt = 3打, OB0, ペナ0 → スコア3", () => {
    const result = computeScoreFromShots(par3Par(), 0, 0);
    expect(result.computedScore).toBe(3);
    expect(result.computedPutts).toBe(2);
  });

  it("Par5パー: tee+approach+approach+putt+putt = 5打, OB0, ペナ0 → スコア5", () => {
    const result = computeScoreFromShots(par5Par(), 0, 0);
    expect(result.computedScore).toBe(5);
    expect(result.computedPutts).toBe(2);
    expect(result.approachShots).toBe(2);
  });

  it("OB1回: 4打 + OB1 = スコア5", () => {
    // tee(OB) → tee(FW) → approach → putt → putt = 5物理打 + OB1 = 6
    // いや、OBの場合: tee(OB)→打ち直しtee(FW)→approach→putt→putt = 5打 + 1OB = 6
    const shots: Shot[] = [
      tee({ result: "ob" }),
      tee({ result: "fairway" }),
      approach(),
      putt({ result: "front" }),
      putt(),
    ];
    const result = computeScoreFromShots(shots, 1, 0);
    expect(result.computedScore).toBe(6); // 5打 + 1OB
    expect(result.computedPutts).toBe(2);
    expect(result.totalShots).toBe(5);
  });

  it("ペナルティ1回: 4打 + ペナ1 = スコア5", () => {
    const shots: Shot[] = [tee(), approach(), putt({ result: "front" }), putt()];
    const result = computeScoreFromShots(shots, 0, 1);
    expect(result.computedScore).toBe(5); // 4打 + 1ペナ
    expect(result.computedPutts).toBe(2);
  });

  it("OB2回 + ペナ1回: 7打 + 2OB + 1ペナ = 10", () => {
    const shots: Shot[] = [
      tee({ result: "ob" }),
      tee({ result: "ob" }),
      tee({ result: "fairway" }),
      approach(),
      approach(),
      putt({ result: "front" }),
      putt(),
    ];
    const result = computeScoreFromShots(shots, 2, 1);
    expect(result.computedScore).toBe(10); // 7打 + 2OB + 1ペナ
    expect(result.computedPutts).toBe(2);
  });

  it("チップインバーディー（パットなし）: tee+approach = 2打, パット0", () => {
    const shots: Shot[] = [tee(), approach({ result: "on-center" })];
    const result = computeScoreFromShots(shots, 0, 0);
    expect(result.computedScore).toBe(2);
    expect(result.computedPutts).toBe(0);
    expect(result.puttShots).toBe(0);
  });

  it("3パット: tee+approach+putt+putt+putt = 5打, パット3", () => {
    const shots: Shot[] = [
      tee(),
      approach(),
      putt({ result: "back" }),
      putt({ result: "front" }),
      putt(),
    ];
    const result = computeScoreFromShots(shots, 0, 0);
    expect(result.computedScore).toBe(5);
    expect(result.computedPutts).toBe(3);
  });

  it("ワンパット: tee+approach+putt = 3打, パット1", () => {
    const shots: Shot[] = [tee(), approach(), putt()];
    const result = computeScoreFromShots(shots, 0, 0);
    expect(result.computedScore).toBe(3);
    expect(result.computedPutts).toBe(1);
  });

  it("OKパット: tee+approach+putt(OK) = 3打, パット1", () => {
    const shots: Shot[] = [tee(), approach(), putt({ note: "OK", distance: 1, result: "in" })];
    const result = computeScoreFromShots(shots, 0, 0);
    expect(result.computedScore).toBe(3);
    expect(result.computedPutts).toBe(1);
  });

  it("ダブルOB: 物理6打 + OB2 = 8", () => {
    const shots: Shot[] = [
      tee({ result: "ob" }),
      tee({ result: "ob" }),
      tee({ result: "fairway" }),
      approach(),
      putt({ result: "front" }),
      putt(),
    ];
    const result = computeScoreFromShots(shots, 2, 0);
    expect(result.computedScore).toBe(8);
  });

  it("ショットタイプ別の内訳が正しい", () => {
    const shots: Shot[] = [
      tee(),
      approach(),
      approach(),
      approach(),
      putt({ result: "back" }),
      putt(),
    ];
    const result = computeScoreFromShots(shots, 0, 0);
    expect(result.teeShots).toBe(1);
    expect(result.approachShots).toBe(3);
    expect(result.puttShots).toBe(2);
    expect(result.totalShots).toBe(6);
    expect(result.computedScore).toBe(6);
  });
});

// ======================================
// B. detectShotScoreMismatch: 不一致なし
// ======================================
describe("detectShotScoreMismatch: 一致（不一致なし）", () => {
  it("ショット詳細なし → 常に空（検証スキップ）", () => {
    const result = detectShotScoreMismatch([], 5, 2, 0, 0);
    expect(result).toHaveLength(0);
  });

  it("Par4パー: 4打+0OB+0ペナ=4, パット2 → 一致", () => {
    const result = detectShotScoreMismatch(par4Par(), 4, 2, 0, 0);
    expect(result).toHaveLength(0);
  });

  it("Par3パー: 3打+0OB+0ペナ=3, パット2 → 一致", () => {
    const result = detectShotScoreMismatch(par3Par(), 3, 2, 0, 0);
    expect(result).toHaveLength(0);
  });

  it("Par5パー: 5打+0OB+0ペナ=5, パット2 → 一致", () => {
    const result = detectShotScoreMismatch(par5Par(), 5, 2, 0, 0);
    expect(result).toHaveLength(0);
  });

  it("OBあり: 5打+1OB=6, パット2 → 一致", () => {
    const shots: Shot[] = [
      tee({ result: "ob" }),
      tee(),
      approach(),
      putt({ result: "front" }),
      putt(),
    ];
    const result = detectShotScoreMismatch(shots, 6, 2, 1, 0);
    expect(result).toHaveLength(0);
  });

  it("ペナルティあり: 4打+1ペナ=5, パット2 → 一致", () => {
    const result = detectShotScoreMismatch(par4Par(), 5, 2, 0, 1);
    expect(result).toHaveLength(0);
  });

  it("OB+ペナルティ: 5打+1OB+1ペナ=7, パット2 → 一致", () => {
    const shots: Shot[] = [
      tee({ result: "ob" }),
      tee(),
      approach(),
      putt({ result: "front" }),
      putt(),
    ];
    const result = detectShotScoreMismatch(shots, 7, 2, 1, 1);
    expect(result).toHaveLength(0);
  });

  it("3パット: 5打, パット3 → 一致", () => {
    const shots: Shot[] = [
      tee(),
      approach(),
      putt({ result: "back" }),
      putt({ result: "front" }),
      putt(),
    ];
    const result = detectShotScoreMismatch(shots, 5, 3, 0, 0);
    expect(result).toHaveLength(0);
  });

  it("チップイン（パットなし）: 2打, パット0 → 一致", () => {
    const shots: Shot[] = [tee(), approach()];
    const result = detectShotScoreMismatch(shots, 2, 0, 0, 0);
    expect(result).toHaveLength(0);
  });
});

// ======================================
// C. detectShotScoreMismatch: スコア不一致
// ======================================
describe("detectShotScoreMismatch: スコア不一致", () => {
  it("スコアが多すぎる: 4打なのにスコア5", () => {
    const result = detectShotScoreMismatch(par4Par(), 5, 2, 0, 0);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("score");
    expect(result[0].expected).toBe(4);
    expect(result[0].actual).toBe(5);
  });

  it("スコアが少なすぎる: 4打なのにスコア3", () => {
    const result = detectShotScoreMismatch(par4Par(), 3, 2, 0, 0);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("score");
    expect(result[0].expected).toBe(4);
    expect(result[0].actual).toBe(3);
  });

  it("OBがスコアに反映されていない: 5打+1OB=6 なのにスコア5", () => {
    const shots: Shot[] = [
      tee({ result: "ob" }),
      tee(),
      approach(),
      putt({ result: "front" }),
      putt(),
    ];
    const result = detectShotScoreMismatch(shots, 5, 2, 1, 0);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("score");
    expect(result[0].expected).toBe(6);
    expect(result[0].actual).toBe(5);
  });

  it("ペナルティがスコアに反映されていない: 4打+1ペナ=5 なのにスコア4", () => {
    const result = detectShotScoreMismatch(par4Par(), 4, 2, 0, 1);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("score");
    expect(result[0].expected).toBe(5);
    expect(result[0].actual).toBe(4);
  });

  it("OBを加算しすぎ: 5打+1OB=6 なのにスコア7", () => {
    const shots: Shot[] = [
      tee({ result: "ob" }),
      tee(),
      approach(),
      putt({ result: "front" }),
      putt(),
    ];
    const result = detectShotScoreMismatch(shots, 7, 2, 1, 0);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("score");
    expect(result[0].expected).toBe(6);
  });

  it("大きなスコア差: 4打なのにスコア10", () => {
    const result = detectShotScoreMismatch(par4Par(), 10, 2, 0, 0);
    expect(result).toHaveLength(1);
    expect(result[0].expected).toBe(4);
    expect(result[0].actual).toBe(10);
  });
});

// ======================================
// D. detectShotScoreMismatch: パット不一致
// ======================================
describe("detectShotScoreMismatch: パット不一致", () => {
  it("パットが多すぎる: パットショット2なのにパット3", () => {
    const result = detectShotScoreMismatch(par4Par(), 4, 3, 0, 0);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("putts");
    expect(result[0].expected).toBe(2);
    expect(result[0].actual).toBe(3);
  });

  it("パットが少なすぎる: パットショット2なのにパット1", () => {
    const result = detectShotScoreMismatch(par4Par(), 4, 1, 0, 0);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("putts");
    expect(result[0].expected).toBe(2);
    expect(result[0].actual).toBe(1);
  });

  it("パット0のはずなのにパット1: チップイン", () => {
    const shots: Shot[] = [tee(), approach()];
    const result = detectShotScoreMismatch(shots, 2, 1, 0, 0);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("putts");
    expect(result[0].expected).toBe(0);
    expect(result[0].actual).toBe(1);
  });

  it("3パットなのにパット2", () => {
    const shots: Shot[] = [
      tee(),
      approach(),
      putt({ result: "back" }),
      putt({ result: "front" }),
      putt(),
    ];
    const result = detectShotScoreMismatch(shots, 5, 2, 0, 0);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("putts");
    expect(result[0].expected).toBe(3);
    expect(result[0].actual).toBe(2);
  });
});

// ======================================
// E. detectShotScoreMismatch: スコアとパット両方不一致
// ======================================
describe("detectShotScoreMismatch: 両方不一致", () => {
  it("スコアもパットも合わない", () => {
    // 4打, パットショット2 → score=4, putts=2 が正
    const result = detectShotScoreMismatch(par4Par(), 6, 3, 0, 0);
    expect(result).toHaveLength(2);
    const scoreErr = result.find((m) => m.field === "score")!;
    const puttsErr = result.find((m) => m.field === "putts")!;
    expect(scoreErr.expected).toBe(4);
    expect(scoreErr.actual).toBe(6);
    expect(puttsErr.expected).toBe(2);
    expect(puttsErr.actual).toBe(3);
  });

  it("OBありで両方ずれ: 5打+1OB=6, パット2 なのに score=5, putts=1", () => {
    const shots: Shot[] = [
      tee({ result: "ob" }),
      tee(),
      approach(),
      putt({ result: "front" }),
      putt(),
    ];
    const result = detectShotScoreMismatch(shots, 5, 1, 1, 0);
    expect(result).toHaveLength(2);
    expect(result[0].field).toBe("score");
    expect(result[0].expected).toBe(6);
    expect(result[1].field).toBe("putts");
    expect(result[1].expected).toBe(2);
  });
});

// ======================================
// F. detectShotScoreMismatch: メッセージ内容
// ======================================
describe("detectShotScoreMismatch: メッセージ", () => {
  it("スコア不一致メッセージにショット数・OB・ペナが含まれる", () => {
    const shots: Shot[] = [
      tee({ result: "ob" }),
      tee(),
      approach(),
      putt({ result: "front" }),
      putt(),
    ];
    const result = detectShotScoreMismatch(shots, 5, 2, 1, 0);
    expect(result[0].message).toContain("ショット数(5)");
    expect(result[0].message).toContain("OB(1)");
    expect(result[0].message).toContain("ペナ(0)");
    expect(result[0].message).toContain("6");
    expect(result[0].message).toContain("スコア(5)");
  });

  it("パット不一致メッセージにパットショット数が含まれる", () => {
    const result = detectShotScoreMismatch(par4Par(), 4, 3, 0, 0);
    expect(result[0].message).toContain("パットショット数(2)");
    expect(result[0].message).toContain("パット(3)");
  });
});

// ======================================
// G. エッジケース
// ======================================
describe("detectShotScoreMismatch: エッジケース", () => {
  it("ショット1つだけ（ホールインワン相当）: tee=1打, パット0 → 一致", () => {
    const shots: Shot[] = [tee()];
    const result = detectShotScoreMismatch(shots, 1, 0, 0, 0);
    expect(result).toHaveLength(0);
  });

  it("パットだけ（グリーン上からスタート等）: putt=1打, パット1", () => {
    const shots: Shot[] = [putt()];
    // score=1, putts=1 → 一致
    const result = detectShotScoreMismatch(shots, 1, 1, 0, 0);
    expect(result).toHaveLength(0);
    // パットだけでパット不一致: putts=2 なのにパットショット1つ
    const result2 = detectShotScoreMismatch(shots, 1, 2, 0, 0);
    expect(result2).toHaveLength(1);
    expect(result2[0].field).toBe("putts");
  });

  it("大量のショット（10打）: score=10, putts=4 → 一致", () => {
    const shots: Shot[] = [
      tee(),
      approach(),
      approach(),
      approach(),
      approach(),
      approach(),
      putt({ result: "back" }),
      putt({ result: "front" }),
      putt({ result: "left" }),
      putt(),
    ];
    const result = detectShotScoreMismatch(shots, 10, 4, 0, 0);
    expect(result).toHaveLength(0);
  });

  it("OBとペナルティ両方: 4打+2OB+1ペナ=7", () => {
    const result = detectShotScoreMismatch(par4Par(), 7, 2, 2, 1);
    expect(result).toHaveLength(0);
  });

  it("OBとペナルティ両方で不一致: 4打+2OB+1ペナ=7 なのにスコア6", () => {
    const result = detectShotScoreMismatch(par4Par(), 6, 2, 2, 1);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("score");
    expect(result[0].expected).toBe(7);
    expect(result[0].actual).toBe(6);
  });

  it("スコア0は不一致として検出（ショットがあるのにスコア0）", () => {
    const result = detectShotScoreMismatch(par4Par(), 0, 2, 0, 0);
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe("score");
    expect(result[0].expected).toBe(4);
    expect(result[0].actual).toBe(0);
  });

  it("パット0はチップインなら正しい", () => {
    const shots: Shot[] = [tee(), approach()];
    const result = detectShotScoreMismatch(shots, 2, 0, 0, 0);
    expect(result).toHaveLength(0);
  });
});
