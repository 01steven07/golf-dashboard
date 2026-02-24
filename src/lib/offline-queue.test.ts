import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  enqueue,
  dequeue,
  getQueue,
  getQueueLength,
  processQueue,
  isNetworkError,
  CreateRoundPayload,
} from "./offline-queue";

// Mock supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

// Mock authFetch
vi.mock("@/lib/api-client", () => ({
  authFetch: vi.fn(),
}));

// Simple localStorage mock
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  });
  vi.stubGlobal("crypto", {
    randomUUID: () => "test-uuid-" + Math.random().toString(36).slice(2, 8),
  });
});

const samplePayload: CreateRoundPayload = {
  memberId: "member-1",
  courseName: "Test Course",
  courseId: null,
  date: "2026-01-01",
  teeColor: "White",
  outCourseName: null,
  inCourseName: null,
  imageUrl: null,
  scores: [
    {
      hole_number: 1,
      par: 4,
      distance: 350,
      score: 5,
      putts: 2,
      fairway_result: "keep",
      ob: 0,
      bunker: 0,
      penalty: 0,
    },
  ],
};

// ======================================
// A. キューCRUD
// ======================================
describe("offline-queue: CRUD", () => {
  it("enqueue adds item and returns id", () => {
    const id = enqueue("create-round", samplePayload);
    expect(id).toBeTruthy();
    expect(getQueue()).toHaveLength(1);
    expect(getQueue()[0].type).toBe("create-round");
  });

  it("enqueue multiple items", () => {
    enqueue("create-round", samplePayload);
    enqueue("create-round", samplePayload);
    enqueue("add-scores", { roundId: "r1", scores: [], courseLabel: "OUT" });
    expect(getQueueLength()).toBe(3);
  });

  it("dequeue removes specific item", () => {
    const id1 = enqueue("create-round", samplePayload);
    const id2 = enqueue("create-round", samplePayload);
    dequeue(id1);
    const queue = getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe(id2);
  });

  it("dequeue non-existent id is no-op", () => {
    enqueue("create-round", samplePayload);
    dequeue("non-existent");
    expect(getQueueLength()).toBe(1);
  });

  it("getQueue returns empty array for empty queue", () => {
    expect(getQueue()).toEqual([]);
  });

  it("getQueueLength returns 0 for empty queue", () => {
    expect(getQueueLength()).toBe(0);
  });
});

// ======================================
// B. processQueue
// ======================================
describe("offline-queue: processQueue", () => {
  it("returns { synced: 0, failed: 0 } for empty queue", async () => {
    const result = await processQueue();
    expect(result).toEqual({ synced: 0, failed: 0 });
  });
});

// ======================================
// C. isNetworkError
// ======================================
describe("offline-queue: isNetworkError", () => {
  it('TypeError("Failed to fetch") → true', () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
  });

  it('TypeError("NetworkError when attempting...") → true', () => {
    expect(isNetworkError(new TypeError("NetworkError when attempting to fetch"))).toBe(
      true,
    );
  });

  it('TypeError("Network request failed") → true', () => {
    expect(isNetworkError(new TypeError("Network request failed"))).toBe(true);
  });

  it("regular Error → false", () => {
    expect(isNetworkError(new Error("Something went wrong"))).toBe(false);
  });

  it("object with code NETWORK_ERROR → true", () => {
    expect(isNetworkError({ code: "NETWORK_ERROR" })).toBe(true);
  });

  it("null → false", () => {
    expect(isNetworkError(null)).toBe(false);
  });

  it("undefined → false", () => {
    expect(isNetworkError(undefined)).toBe(false);
  });
});

// ======================================
// D. localStorage破損時のフォールバック
// ======================================
describe("offline-queue: corrupted localStorage", () => {
  it("returns empty array when localStorage has invalid JSON", () => {
    store["golf-offline-queue"] = "not-valid-json{{{";
    expect(getQueue()).toEqual([]);
    expect(getQueueLength()).toBe(0);
  });

  it("enqueue still works after corrupted state", () => {
    store["golf-offline-queue"] = "corrupted";
    // enqueue reads the queue first (gets []), then writes
    const id = enqueue("create-round", samplePayload);
    expect(id).toBeTruthy();
    expect(getQueueLength()).toBe(1);
  });
});
