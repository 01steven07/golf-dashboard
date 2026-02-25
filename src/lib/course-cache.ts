import { Course, CourseWithDetails } from "@/types/database";

const STORAGE_KEY = "golf-course-cache";
const DETAIL_STORAGE_KEY = "golf-course-detail-cache";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  courses: Course[];
  timestamp: number;
}

interface DetailCacheStore {
  [courseId: string]: { data: CourseWithDetails; timestamp: number };
}

// --- Course list cache ---

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

// --- Course detail cache ---

function readDetailStore(): DetailCacheStore {
  try {
    const raw = localStorage.getItem(DETAIL_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DetailCacheStore;
  } catch {
    return {};
  }
}

export function setCourseDetailCache(course: CourseWithDetails): void {
  try {
    const store = readDetailStore();
    store[course.id] = { data: course, timestamp: Date.now() };
    localStorage.setItem(DETAIL_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // storage full or unavailable
  }
}

export function getCourseDetailCache(courseId: string): CourseWithDetails | null {
  try {
    const store = readDetailStore();
    const entry = store[courseId];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > MAX_AGE_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}
