import { describe, it, expect } from "vitest";
import { buildCourseHoleIdMap } from "./resolve-course-holes";
import { SubCourseWithHoles } from "@/types/database";

const makeSubCourse = (
  id: string,
  name: string,
  holes: { id: string; hole_number: number; par: 3 | 4 | 5 | 6 }[]
): SubCourseWithHoles => ({
  id,
  course_id: "course-1",
  name,
  hole_count: holes.length,
  sort_order: 0,
  holes: holes.map((h) => ({
    id: h.id,
    sub_course_id: id,
    hole_number: h.hole_number,
    par: h.par,
    handicap: null,
    distances: {},
  })),
});

describe("buildCourseHoleIdMap", () => {
  const outCourse = makeSubCourse("sc-out", "OUT", [
    { id: "h1", hole_number: 1, par: 4 },
    { id: "h2", hole_number: 2, par: 3 },
    { id: "h3", hole_number: 3, par: 5 },
  ]);
  const inCourse = makeSubCourse("sc-in", "IN", [
    { id: "h4", hole_number: 1, par: 4 },
    { id: "h5", hole_number: 2, par: 4 },
    { id: "h6", hole_number: 3, par: 3 },
  ]);
  const subCourses = [outCourse, inCourse];

  it("should map hole numbers to course_hole_ids in selected order", () => {
    const map = buildCourseHoleIdMap(subCourses, ["sc-out", "sc-in"]);
    expect(map.get(1)).toBe("h1");
    expect(map.get(2)).toBe("h2");
    expect(map.get(3)).toBe("h3");
    expect(map.get(4)).toBe("h4");
    expect(map.get(5)).toBe("h5");
    expect(map.get(6)).toBe("h6");
    expect(map.size).toBe(6);
  });

  it("should respect reversed sub-course order", () => {
    const map = buildCourseHoleIdMap(subCourses, ["sc-in", "sc-out"]);
    expect(map.get(1)).toBe("h4"); // IN course first
    expect(map.get(2)).toBe("h5");
    expect(map.get(3)).toBe("h6");
    expect(map.get(4)).toBe("h1"); // OUT course second
    expect(map.get(5)).toBe("h2");
    expect(map.get(6)).toBe("h3");
  });

  it("should apply hole offset for add mode", () => {
    const map = buildCourseHoleIdMap(subCourses, ["sc-in"], 9);
    expect(map.get(10)).toBe("h4");
    expect(map.get(11)).toBe("h5");
    expect(map.get(12)).toBe("h6");
    expect(map.size).toBe(3);
  });

  it("should return empty map when no sub courses match", () => {
    const map = buildCourseHoleIdMap(subCourses, ["non-existent"]);
    expect(map.size).toBe(0);
  });

  it("should return empty map for empty selectedSubCourseIds", () => {
    const map = buildCourseHoleIdMap(subCourses, []);
    expect(map.size).toBe(0);
  });

  it("should sort holes by hole_number within each sub-course", () => {
    const unsortedCourse = makeSubCourse("sc-unsorted", "UNSORTED", [
      { id: "h-c", hole_number: 3, par: 5 },
      { id: "h-a", hole_number: 1, par: 4 },
      { id: "h-b", hole_number: 2, par: 3 },
    ]);
    const map = buildCourseHoleIdMap([unsortedCourse], ["sc-unsorted"]);
    expect(map.get(1)).toBe("h-a");
    expect(map.get(2)).toBe("h-b");
    expect(map.get(3)).toBe("h-c");
  });
});
