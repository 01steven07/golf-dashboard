import { describe, it, expect } from "vitest";
import { getFallbackSectionLabels, resolveSectionLabels } from "./resolve-section-labels";

describe("getFallbackSectionLabels", () => {
  it("should return OUT/IN when both are null", () => {
    expect(getFallbackSectionLabels(null, null)).toEqual(["OUT", "IN"]);
  });

  it("should use provided names when available", () => {
    expect(getFallbackSectionLabels("東", "西")).toEqual(["東", "西"]);
  });

  it("should include ext_course_labels", () => {
    expect(getFallbackSectionLabels("東", "西", ["南"])).toEqual(["東", "西", "南"]);
  });

  it("should fallback partially when only one is null", () => {
    expect(getFallbackSectionLabels("東", null)).toEqual(["東", "IN"]);
    expect(getFallbackSectionLabels(null, "西")).toEqual(["OUT", "西"]);
  });

  it("should handle empty ext_course_labels", () => {
    expect(getFallbackSectionLabels("OUT", "IN", [])).toEqual(["OUT", "IN"]);
  });
});

describe("resolveSectionLabels", () => {
  it("should resolve IDs to names using the map", () => {
    const nameMap = new Map([
      ["id-1", "東"],
      ["id-2", "西"],
    ]);
    expect(resolveSectionLabels(["id-1", "id-2"], nameMap)).toEqual(["東", "西"]);
  });

  it("should return ??? for unknown IDs", () => {
    const nameMap = new Map([["id-1", "東"]]);
    expect(resolveSectionLabels(["id-1", "id-unknown"], nameMap)).toEqual(["東", "???"]);
  });

  it("should return empty array for empty input", () => {
    expect(resolveSectionLabels([], new Map())).toEqual([]);
  });

  it("should preserve order of played_sub_course_ids", () => {
    const nameMap = new Map([
      ["id-1", "東"],
      ["id-2", "西"],
      ["id-3", "南"],
    ]);
    expect(resolveSectionLabels(["id-3", "id-1"], nameMap)).toEqual(["南", "東"]);
  });
});
