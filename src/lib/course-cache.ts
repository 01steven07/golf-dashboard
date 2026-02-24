import { Course } from "@/types/database";

const STORAGE_KEY = "golf-course-cache";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  courses: Course[];
  timestamp: number;
}

export function setCourseCache(courses: Course[]): void {
  try {
    const entry: CacheEntry = { courses, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // storage full or unavailable
  }
}

export function getCourseCache(): Course[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.timestamp > MAX_AGE_MS) return null;
    return entry.courses;
  } catch {
    return null;
  }
}
