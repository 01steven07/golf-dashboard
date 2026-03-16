import { supabase } from "@/lib/supabase";
import { authFetch } from "@/lib/api-client";

const STORAGE_KEY = "golf-offline-queue";

export type OfflineQueueItemType = "create-round" | "add-scores";

export interface CreateRoundPayload {
  memberId: string;
  courseName: string;
  courseId: string | null;
  date: string;
  teeColor: string;
  outCourseName: string | null;
  inCourseName: string | null;
  imageUrl: string | null;
  playedSubCourseIds?: string[];
  scores: {
    hole_number: number;
    par: number;
    distance: number | null;
    score: number;
    putts: number;
    fairway_result: string;
    ob: number;
    bunker: number;
    penalty: number;
    pin_position?: string | null;
    shots_detail?: unknown[] | null;
    course_hole_id?: string | null;
  }[];
}

export interface AddScoresPayload {
  roundId: string;
  scores: Record<string, unknown>[];
  courseLabel: string;
}

export interface OfflineQueueItem {
  id: string;
  createdAt: string;
  type: OfflineQueueItemType;
  payload: CreateRoundPayload | AddScoresPayload;
}

function readQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineQueueItem[];
  } catch {
    return [];
  }
}

function writeQueue(queue: OfflineQueueItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // storage full or unavailable
  }
}

export function enqueue(
  type: OfflineQueueItemType,
  payload: CreateRoundPayload | AddScoresPayload,
): string {
  const id = crypto.randomUUID();
  const item: OfflineQueueItem = {
    id,
    createdAt: new Date().toISOString(),
    type,
    payload,
  };
  const queue = readQueue();
  queue.push(item);
  writeQueue(queue);
  return id;
}

export function getQueue(): OfflineQueueItem[] {
  return readQueue();
}

export function dequeue(id: string): void {
  const queue = readQueue().filter((item) => item.id !== id);
  writeQueue(queue);
}

export function getQueueLength(): number {
  return readQueue().length;
}

export function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
    return true;
  }
  if (err instanceof TypeError && err.message.includes("NetworkError")) {
    return true;
  }
  if (err instanceof TypeError && err.message.includes("Network request failed")) {
    return true;
  }
  if (
    err !== null &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code: string }).code === "NETWORK_ERROR"
  ) {
    return true;
  }
  return false;
}

async function processCreateRound(payload: CreateRoundPayload): Promise<void> {
  // Resolve course ID
  let courseId = payload.courseId;
  if (!courseId && payload.courseName) {
    const { data: existing } = await supabase
      .from("courses")
      .select("id")
      .eq("name", payload.courseName)
      .single();

    if (existing) {
      courseId = existing.id;
    } else {
      const { data: newCourse, error: courseErr } = await supabase
        .from("courses")
        .insert({ name: payload.courseName })
        .select()
        .single();
      if (courseErr) throw courseErr;
      courseId = newCourse.id;
    }
  }

  // Insert round
  const { data: round, error: roundErr } = await supabase
    .from("rounds")
    .insert({
      member_id: payload.memberId,
      course_id: courseId,
      date: payload.date,
      tee_color: payload.teeColor,
      image_url: payload.imageUrl,
      out_course_name: payload.outCourseName,
      in_course_name: payload.inCourseName,
      played_sub_course_ids: payload.playedSubCourseIds ?? [],
    })
    .select()
    .single();

  if (roundErr) throw roundErr;

  // Insert scores
  const scoreRecords = payload.scores.map((s) => ({
    round_id: round.id,
    ...s,
  }));

  const { error: scoresErr } = await supabase.from("scores").insert(scoreRecords);
  if (scoresErr) throw scoresErr;
}

async function processAddScores(payload: AddScoresPayload): Promise<void> {
  const res = await authFetch(`/api/rounds/${payload.roundId}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scores: payload.scores,
      course_label: payload.courseLabel,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to add scores");
  }
}

export async function processQueue(): Promise<{ synced: number; failed: number }> {
  const queue = readQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      if (item.type === "create-round") {
        await processCreateRound(item.payload as CreateRoundPayload);
      } else {
        await processAddScores(item.payload as AddScoresPayload);
      }
      dequeue(item.id);
      synced++;
    } catch (err) {
      if (isNetworkError(err)) {
        // Still offline, stop processing
        break;
      }
      // Non-network error: skip this item and continue
      console.error("Failed to process offline queue item:", item.id, err);
      failed++;
    }
  }

  return { synced, failed };
}
