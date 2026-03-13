import { describe, it, expect } from "vitest";
import { Shot, HoleData } from "@/types/shot";
import {
  isCupIn,
  isOnGreen,
  getShotAddWarning,
  getHoleWarnings,
} from "./shot-validation";

// ヘルパー: 最小限のショットを生成
function teeShot(result: "fairway" | "rough" | "bunker" | "ob" | "penalty" = "fairway"): Shot {
  return {
    type: "tee",
    club: "1W",
    result,
    resultDirection: "center",
    wind: "none",
    rating: 3,
    note: "",
  };
}

function approachShot(result: string = "on-center"): Shot {
  return {
    type: "approach",
    club: "7I",
    lie: "fairway",
    slope: "flat",
    result: result as Shot extends { type: "approach" } ? Shot["result"] : never,
    wind: "none",
    distance: 150,
    rating: 3,
    note: "",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

function puttShot(result: "in" | "front" | "back" | "left" | "right" = "in"): Shot {
  return {
    type: "putt",
    distance: 5,
    slope: "flat",
    break: "straight",
    result,
    rating: 3,
    note: "",
  };
}

function makeHole(shots: Shot[], par: 3 | 4 | 5 | 6 = 4): HoleData {
  return {
    holeNumber: 1,
    par,
    distance: null,
    pinPosition: null,
    shots,
  };
}

describe("isCupIn", () => {
  it("パット result=in がある場合は true", () => {
    expect(isCupIn([teeShot(), approachShot(), puttShot("in")])).toBe(true);
  });

  it("パットがない場合は false", () => {
    expect(isCupIn([teeShot(), approachShot()])).toBe(false);
  });

  it("パット外し(front)のみの場合は false", () => {
    expect(isCupIn([teeShot(), approachShot(), puttShot("front")])).toBe(false);
  });

  it("ショットなしは false", () => {
    expect(isCupIn([])).toBe(false);
  });
});

describe("isOnGreen", () => {
  it("アプローチ on-center の後は true", () => {
    expect(isOnGreen([teeShot(), approachShot("on-center")], 4)).toBe(true);
  });

  it("アプローチ miss-left の後は false", () => {
    expect(isOnGreen([teeShot(), approachShot("miss-left")], 4)).toBe(false);
  });

  it("パット外し後も true（グリーン上）", () => {
    expect(isOnGreen([teeShot(), approachShot("on-center"), puttShot("front")], 4)).toBe(true);
  });

  it("Par3 ティーショット fairway はグリーンオン", () => {
    expect(isOnGreen([teeShot("fairway")], 3)).toBe(true);
  });

  it("Par3 ティーショット rough はグリーンオンではない", () => {
    expect(isOnGreen([teeShot("rough")], 3)).toBe(false);
  });

  it("Par4 ティーショット fairway はグリーンオンではない", () => {
    expect(isOnGreen([teeShot("fairway")], 4)).toBe(false);
  });

  it("ショットなしは false", () => {
    expect(isOnGreen([], 4)).toBe(false);
  });
});

describe("getShotAddWarning", () => {
  it("グリーンオン後に approach を追加 → 警告あり", () => {
    const shots = [teeShot(), approachShot("on-center")];
    expect(getShotAddWarning(shots, 4, "approach")).not.toBeNull();
  });

  it("グリーンオン後に tee を追加 → 警告あり", () => {
    const shots = [teeShot(), approachShot("on-center")];
    expect(getShotAddWarning(shots, 4, "tee")).not.toBeNull();
  });

  it("グリーンオン後に putt を追加 → 警告なし", () => {
    const shots = [teeShot(), approachShot("on-center")];
    expect(getShotAddWarning(shots, 4, "putt")).toBeNull();
  });

  it("グリーンオンしていない場合 → 警告なし", () => {
    const shots = [teeShot(), approachShot("miss-left")];
    expect(getShotAddWarning(shots, 4, "approach")).toBeNull();
  });

  it("ショットなしで追加 → 警告なし", () => {
    expect(getShotAddWarning([], 4, "tee")).toBeNull();
  });
});

describe("getHoleWarnings", () => {
  it("ショット0件 → 警告あり", () => {
    const hole = makeHole([]);
    const warnings = getHoleWarnings(hole);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("入力されていません");
  });

  it("カップインなし → 警告あり", () => {
    const hole = makeHole([teeShot(), approachShot(), puttShot("front")]);
    const warnings = getHoleWarnings(hole);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("カップイン");
  });

  it("正常（カップインあり） → 空配列", () => {
    const hole = makeHole([teeShot(), approachShot(), puttShot("in")]);
    const warnings = getHoleWarnings(hole);
    expect(warnings).toHaveLength(0);
  });
});
