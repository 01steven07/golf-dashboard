import { describe, it, expect } from "vitest";
import {
  validatePar,
  validateDistance,
  validateFairwayResult,
  normalizeOcrScores,
} from "./route";

describe("validatePar", () => {
  it("should return valid par values", () => {
    expect(validatePar(3)).toBe(3);
    expect(validatePar(4)).toBe(4);
    expect(validatePar(5)).toBe(5);
  });

  it("should return null for invalid par values", () => {
    expect(validatePar(2)).toBeNull();
    expect(validatePar(6)).toBeNull();
    expect(validatePar(0)).toBeNull();
    expect(validatePar(-1)).toBeNull();
    expect(validatePar("4")).toBeNull();
    expect(validatePar(null)).toBeNull();
    expect(validatePar(undefined)).toBeNull();
  });
});

describe("validateDistance", () => {
  it("should return valid distance values", () => {
    expect(validateDistance(100)).toBe(100);
    expect(validateDistance(350)).toBe(350);
    expect(validateDistance(550)).toBe(550);
    expect(validateDistance(700)).toBe(700);
    expect(validateDistance(1)).toBe(1);
  });

  it("should round decimal distances", () => {
    expect(validateDistance(350.4)).toBe(350);
    expect(validateDistance(350.6)).toBe(351);
  });

  it("should return null for invalid distances", () => {
    expect(validateDistance(0)).toBeNull();
    expect(validateDistance(-100)).toBeNull();
    expect(validateDistance(701)).toBeNull();
    expect(validateDistance(1000)).toBeNull();
    expect(validateDistance("350")).toBeNull();
    expect(validateDistance(null)).toBeNull();
    expect(validateDistance(undefined)).toBeNull();
  });
});

describe("validateFairwayResult", () => {
  it("should return valid fairway results", () => {
    expect(validateFairwayResult("keep")).toBe("keep");
    expect(validateFairwayResult("left")).toBe("left");
    expect(validateFairwayResult("right")).toBe("right");
  });

  it("should return null for invalid fairway results", () => {
    expect(validateFairwayResult("center")).toBeNull();
    expect(validateFairwayResult("KEEP")).toBeNull();
    expect(validateFairwayResult("")).toBeNull();
    expect(validateFairwayResult(null)).toBeNull();
    expect(validateFairwayResult(undefined)).toBeNull();
    expect(validateFairwayResult(1)).toBeNull();
  });
});

describe("normalizeOcrScores", () => {
  it("should create 18 holes from empty input", () => {
    const result = normalizeOcrScores([]);
    expect(result).toHaveLength(18);
    expect(result[0].hole_number).toBe(1);
    expect(result[17].hole_number).toBe(18);
  });

  it("should use default values for missing data", () => {
    const result = normalizeOcrScores([]);
    const hole = result[0];

    expect(hole.par).toBe(4);
    expect(hole.distance).toBeNull();
    expect(hole.score).toBe(4);
    expect(hole.putts).toBe(2);
    expect(hole.fairway_result).toBe("keep");
    expect(hole.ob).toBe(0);
    expect(hole.bunker).toBe(0);
    expect(hole.penalty).toBe(0);
  });

  it("should preserve valid input data", () => {
    const input = [
      {
        hole_number: 1,
        par: 5 as const,
        distance: 520,
        score: 6,
        putts: 3,
        fairway_result: "left" as const,
        ob: 1,
        bunker: 2,
        penalty: 0,
      },
    ];

    const result = normalizeOcrScores(input);
    const hole1 = result[0];

    expect(hole1.par).toBe(5);
    expect(hole1.distance).toBe(520);
    expect(hole1.score).toBe(6);
    expect(hole1.putts).toBe(3);
    expect(hole1.fairway_result).toBe("left");
    expect(hole1.ob).toBe(1);
    expect(hole1.bunker).toBe(2);
    expect(hole1.penalty).toBe(0);
  });

  it("should fill missing holes", () => {
    const input = [
      { hole_number: 1, par: 4 as const, distance: 380, score: 5, putts: 2, fairway_result: "keep" as const, ob: 0, bunker: 0, penalty: 0 },
      { hole_number: 3, par: 3 as const, distance: 150, score: 3, putts: 1, fairway_result: "keep" as const, ob: 0, bunker: 0, penalty: 0 },
    ];

    const result = normalizeOcrScores(input);

    // Hole 1 should have input data
    expect(result[0].distance).toBe(380);

    // Hole 2 should have defaults
    expect(result[1].hole_number).toBe(2);
    expect(result[1].distance).toBeNull();
    expect(result[1].par).toBe(4);

    // Hole 3 should have input data
    expect(result[2].distance).toBe(150);
    expect(result[2].par).toBe(3);
  });

  it("should validate and reject invalid distance", () => {
    const input = [
      { hole_number: 1, distance: 800 }, // Too long
      { hole_number: 2, distance: 0 }, // Zero
      { hole_number: 3, distance: -100 }, // Negative
    ];

    const result = normalizeOcrScores(input);

    expect(result[0].distance).toBeNull();
    expect(result[1].distance).toBeNull();
    expect(result[2].distance).toBeNull();
  });

  it("should validate and reject invalid par", () => {
    const input = [
      { hole_number: 1, par: 2 },
      { hole_number: 2, par: 6 },
    ];

    const result = normalizeOcrScores(input);

    expect(result[0].par).toBe(4); // Default
    expect(result[1].par).toBe(4); // Default
  });
});
