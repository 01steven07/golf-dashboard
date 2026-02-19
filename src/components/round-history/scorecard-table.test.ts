import { describe, it, expect } from "vitest";
import { getSectionLabels } from "./scorecard-table";

describe("getSectionLabels", () => {
  it("デフォルト（18H）: OUT, IN を返す", () => {
    expect(getSectionLabels()).toEqual(["OUT", "IN"]);
    expect(getSectionLabels([])).toEqual(["OUT", "IN"]);
  });

  it("27H（追加OUT）: OUT, IN, OUT を返す", () => {
    expect(getSectionLabels(["OUT"])).toEqual(["OUT", "IN", "OUT"]);
  });

  it("27H（追加IN）: OUT, IN, IN を返す", () => {
    expect(getSectionLabels(["IN"])).toEqual(["OUT", "IN", "IN"]);
  });

  it("36H（追加OUT, IN）: OUT, IN, OUT, IN を返す", () => {
    expect(getSectionLabels(["OUT", "IN"])).toEqual(["OUT", "IN", "OUT", "IN"]);
  });

  it("36H（追加IN, IN）: OUT, IN, IN, IN を返す", () => {
    expect(getSectionLabels(["IN", "IN"])).toEqual(["OUT", "IN", "IN", "IN"]);
  });
});
