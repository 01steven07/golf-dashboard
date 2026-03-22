import { describe, it, expect } from "vitest";
import { aggregateHoleData, getHoleScore } from "./shot-aggregation";
import { HoleData, TeeShot, ApproachShot, PuttShot } from "@/types/shot";

// ======================================
// ヘルパー
// ======================================
function makeTeeShot(overrides?: Partial<TeeShot>): TeeShot {
  return {
    type: "tee",
    club: "1W",
    result: "fairway",
    resultDirection: "center",
    wind: "none",
    rating: 3,
    note: "",
    ...overrides,
  };
}

function makeApproach(overrides?: Partial<ApproachShot>): ApproachShot {
  return {
    type: "approach",
    club: "7I",
    lie: "fairway",
    slope: "flat",
    result: "on-center",
    wind: "none",
    distance: 150,
    rating: 3,
    note: "",
    ...overrides,
  };
}

function makePutt(overrides?: Partial<PuttShot>): PuttShot {
  return {
    type: "putt",
    distance: 5,
    slope: "flat",
    break: "straight",
    result: "in",
    rating: 3,
    note: "",
    ...overrides,
  };
}

function makeHole(overrides: Partial<HoleData> & { shots: HoleData["shots"] }): HoleData {
  return {
    holeNumber: 1,
    par: 4,
    distance: 380,
    pinPosition: null,
    ...overrides,
  };
}

// ======================================
// C. aggregateHoleData テスト
// ======================================
describe("aggregateHoleData", () => {
  it("C-1: 標準Par4（tee + approach + 2putt）→ score=4, putts=2", () => {
    const hole = makeHole({
      shots: [makeTeeShot(), makeApproach(), makePutt({ result: "back" }), makePutt()],
    });
    const result = aggregateHoleData(hole);

    expect(result.score).toBe(4);
    expect(result.putts).toBe(2);
    expect(result.ob).toBe(0);
    expect(result.penalty).toBe(0);
    expect(result.bunker).toBe(0);
    expect(result.fairway_result).toBe("keep");
  });

  it("C-2: Par3（tee + putt）→ score=2, putts=1, fairway_result='keep'", () => {
    const hole = makeHole({
      par: 3,
      distance: 150,
      shots: [makeTeeShot({ club: "7I" }), makePutt()],
    });
    const result = aggregateHoleData(hole);

    expect(result.score).toBe(2);
    expect(result.putts).toBe(1);
    expect(result.fairway_result).toBe("keep");
  });

  it("C-3: OB含む（tee=ob + 打ち直しtee + approach + 2putt）→ score=6, ob=1", () => {
    const hole = makeHole({
      shots: [
        makeTeeShot({ result: "ob", resultDirection: "right" }),
        makeTeeShot({ result: "fairway" }),
        makeApproach(),
        makePutt({ result: "back" }),
        makePutt(),
      ],
    });
    const result = aggregateHoleData(hole);

    expect(result.score).toBe(6); // 5 shots + 1 OB penalty
    expect(result.ob).toBe(1);
  });

  it("C-4: ペナルティ含む（tee=penalty + 打ち直しtee + approach + putt）→ score=5, penalty=1", () => {
    const hole = makeHole({
      shots: [
        makeTeeShot({ result: "penalty" }),
        makeTeeShot({ result: "fairway" }),
        makeApproach(),
        makePutt(),
      ],
    });
    const result = aggregateHoleData(hole);

    expect(result.score).toBe(5); // 4 shots + 1 penalty
    expect(result.penalty).toBe(1);
  });

  it("C-5: バンカーショット → bunker=1", () => {
    const hole = makeHole({
      shots: [makeTeeShot(), makeApproach({ lie: "left-bunker", result: "on-center" }), makePutt()],
    });
    const result = aggregateHoleData(hole);

    expect(result.bunker).toBe(1);
  });

  it("C-6: アプローチOB → ob=1", () => {
    const hole = makeHole({
      shots: [
        makeTeeShot(),
        makeApproach({ result: "ob-left" }),
        makeApproach(),
        makePutt({ result: "back" }),
        makePutt(),
      ],
    });
    const result = aggregateHoleData(hole);

    expect(result.ob).toBe(1);
    expect(result.score).toBe(6); // 5 shots + 1 OB
  });

  it("C-7: アプローチペナルティ → penalty=1", () => {
    const hole = makeHole({
      shots: [makeTeeShot(), makeApproach({ result: "penalty-right" }), makeApproach(), makePutt()],
    });
    const result = aggregateHoleData(hole);

    expect(result.penalty).toBe(1);
    expect(result.score).toBe(5); // 4 shots + 1 penalty
  });

  it("C-8: 複数OB+ペナルティ → ob=2, penalty=1", () => {
    const hole = makeHole({
      shots: [
        makeTeeShot({ result: "ob", resultDirection: "left" }),
        makeTeeShot({ result: "fairway" }),
        makeApproach({ result: "ob-left" }),
        makeApproach(),
        makePutt({ result: "back" }),
        makePutt({ result: "left" }),
        makePutt(),
      ],
    });
    const result = aggregateHoleData(hole);

    expect(result.ob).toBe(2);
    expect(result.score).toBe(9); // 7 shots + 2 OB
  });

  it("C-9: パット0（チップイン）→ putts=0", () => {
    const hole = makeHole({
      shots: [makeTeeShot(), makeApproach({ result: "on-center" })],
    });
    const result = aggregateHoleData(hole);

    expect(result.score).toBe(2);
    expect(result.putts).toBe(0);
  });

  it("C-10: distance / pinPosition が正しく引き継がれる", () => {
    const hole = makeHole({
      distance: 420,
      pinPosition: "back-left",
      shots: [makeTeeShot(), makeApproach(), makePutt()],
    });
    const result = aggregateHoleData(hole);

    expect(result.distance).toBe(420);
    expect(result.pin_position).toBe("back-left");
    expect(result.hole_number).toBe(1);
    expect(result.par).toBe(4);
  });

  it("C-11: shots_detail に元のショット配列がそのまま入る", () => {
    const shots = [makeTeeShot(), makeApproach(), makePutt()];
    const hole = makeHole({ shots });
    const result = aggregateHoleData(hole);

    expect(result.shots_detail).toEqual(shots);
    expect(result.shots_detail).toHaveLength(3);
  });

  it("C-12: fairway_result — ラフ右 → 'right'", () => {
    const hole = makeHole({
      shots: [
        makeTeeShot({ result: "rough", resultDirection: "right" }),
        makeApproach(),
        makePutt(),
      ],
    });
    const result = aggregateHoleData(hole);

    expect(result.fairway_result).toBe("right");
  });

  it("C-13: fairway_result — ラフ左 → 'left'", () => {
    const hole = makeHole({
      shots: [
        makeTeeShot({ result: "rough", resultDirection: "left" }),
        makeApproach(),
        makePutt(),
      ],
    });
    const result = aggregateHoleData(hole);

    expect(result.fairway_result).toBe("left");
  });

  it("C-14: Par6ホール対応", () => {
    const hole = makeHole({
      par: 6 as 3 | 4 | 5 | 6,
      distance: 900,
      shots: [
        makeTeeShot(),
        makeApproach(),
        makeApproach(),
        makePutt({ result: "back" }),
        makePutt(),
      ],
    });
    const result = aggregateHoleData(hole);

    expect(result.par).toBe(6);
    expect(result.distance).toBe(900);
    expect(result.score).toBe(5);
  });
});

describe("getHoleScore", () => {
  it("ショット数のみ（OB/ペナなし）", () => {
    const hole = makeHole({ shots: [makeTeeShot(), makeApproach(), makePutt()] });
    expect(getHoleScore(hole)).toBe(3);
  });

  it("OB+ペナルティ加算", () => {
    const hole = makeHole({
      shots: [
        makeTeeShot({ result: "ob" }),
        makeTeeShot({ result: "penalty" }),
        makeTeeShot(),
        makeApproach({ result: "penalty-left" }),
        makeApproach(),
        makePutt(),
      ],
    });
    // 6 shots + 1 OB + 1 tee penalty + 1 approach penalty = 9
    expect(getHoleScore(hole)).toBe(9);
  });
});
