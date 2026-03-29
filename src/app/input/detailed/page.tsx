"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DetailedRoundData,
  HoleData,
  OptionalFieldSettings,
  DEFAULT_OPTIONAL_FIELDS,
} from "@/types/shot";
import { CourseWithDetails } from "@/types/database";
import { createInitialHoles, createHolesFromCourse } from "@/utils/hole-builder";
import { StepSettings } from "./components/step-settings";
import { StepScoring } from "./components/step-scoring";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { authFetch } from "@/lib/api-client";
import { aggregateHoleData } from "@/utils/shot-aggregation";
import { validateScores } from "@/utils/score-validation";
import { buildCourseHoleIdMap } from "@/utils/resolve-course-holes";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { enqueue, isNetworkError, CreateRoundPayload, AddScoresPayload } from "@/lib/offline-queue";
import { scoresToHoleData } from "@/utils/score-to-holes";
import { Score } from "@/types/database";
import { Suspense } from "react";

type InputStep = "settings" | "scoring";

const STORAGE_KEY = "detailed-input-draft";
const OPTIONAL_FIELDS_KEY = "detailed-input-optional-fields";

interface DraftData {
  step: InputStep;
  currentHole: number;
  roundData: DetailedRoundData;
}

function saveDraft(data: DraftData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

function loadDraft(): DraftData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as DraftData;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export default function DetailedInputPage() {
  return (
    <RequireAuth>
      <Suspense>
        <DetailedInputContent />
      </Suspense>
    </RequireAuth>
  );
}

function DetailedInputContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToRoundId = searchParams.get("addToRound");
  const editRoundId = searchParams.get("editRound");
  const { member } = useAuth();
  const [step, setStep] = useState<InputStep>("settings");
  const [currentHole, setCurrentHole] = useState(1);
  const [addModeReady, setAddModeReady] = useState(false);
  const [addModeHoleOffset, setAddModeHoleOffset] = useState(0);
  const [editScores, setEditScores] = useState<Score[]>([]);
  const [roundData, setRoundData] = useState<DetailedRoundData>({
    courseId: null,
    courseName: "",
    date: new Date().toISOString().split("T")[0],
    teeColor: "White",
    teeId: null,
    subCourseIds: [],
    holes: createInitialHoles(),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveConfirm, setSaveConfirm] = useState<{ warnings: string[] } | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithDetails | null>(null);
  const [draftInfo, setDraftInfo] = useState<{ courseName: string; date: string } | null>(null);
  const [optionalFields, setOptionalFields] =
    useState<OptionalFieldSettings>(DEFAULT_OPTIONAL_FIELDS);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDraftDiscardDialog, setShowDraftDiscardDialog] = useState(false);

  const isDirty = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 起動時にドラフトを確認 + optionalFields読み込み（追加モードではドラフト無効）
  useEffect(() => {
    if (!addToRoundId && !editRoundId) {
      const draft = loadDraft();
      if (draft) {
        setDraftInfo({
          courseName: draft.roundData.courseName,
          date: draft.roundData.date,
        });
      }
    }
    try {
      const stored = localStorage.getItem(OPTIONAL_FIELDS_KEY);
      if (stored) {
        setOptionalFields({ ...DEFAULT_OPTIONAL_FIELDS, ...JSON.parse(stored) });
      }
    } catch {
      // ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 追加モード: 既存ラウンドのデータを読み込み
  useEffect(() => {
    if (!addToRoundId || !member) return;
    let cancelled = false;

    (async () => {
      // 既存ラウンドのデータを取得
      const { data: roundData, error: roundError } = await supabase
        .from("rounds")
        .select("course_id, tee_color, date, courses(id, name, pref)")
        .eq("id", addToRoundId)
        .single();

      if (roundError || !roundData || cancelled) return;

      // 既存スコアの最大ホール番号を取得
      const { data: existingScores } = await supabase
        .from("scores")
        .select("hole_number")
        .eq("round_id", addToRoundId)
        .order("hole_number", { ascending: false })
        .limit(1);

      const maxHole = existingScores?.[0]?.hole_number ?? 0;
      if (cancelled) return;
      setAddModeHoleOffset(maxHole);

      // コース詳細を取得（サブコース情報付き）
      const courseInfo = roundData.courses as unknown as {
        id: string;
        name: string;
        pref: string | null;
      } | null;
      if (courseInfo?.id) {
        const res = await fetch(`/api/courses/${courseInfo.id}`);
        if (res.ok && !cancelled) {
          const courseDetails: CourseWithDetails = await res.json();
          setSelectedCourse(courseDetails);

          // ティーをマッチさせる
          const matchedTee = courseDetails.tees.find((t) => t.name === roundData.tee_color);

          updateRoundData({
            courseId: courseInfo.id,
            courseName: courseInfo.name,
            date: roundData.date,
            teeColor: roundData.tee_color,
            teeId: matchedTee?.id ?? null,
            subCourseIds: [], // ユーザーが追加する分を選択
            holes: [],
          });
          setAddModeReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [addToRoundId, member]); // eslint-disable-line react-hooks/exhaustive-deps

  // 編集モード: 既存ラウンドのデータを読み込み、スコアをHoleDataに変換
  useEffect(() => {
    if (!editRoundId || !member) return;
    let cancelled = false;

    (async () => {
      // ラウンド基本情報を取得
      const { data: roundInfo, error: roundError } = await supabase
        .from("rounds")
        .select("course_id, tee_color, date, played_sub_course_ids, courses(id, name, pref)")
        .eq("id", editRoundId)
        .single();

      if (roundError || !roundInfo || cancelled) return;

      // スコアデータを取得
      const { data: scores, error: scoresError } = await supabase
        .from("scores")
        .select("*")
        .eq("round_id", editRoundId)
        .order("hole_number");

      if (scoresError || !scores || cancelled) return;

      setEditScores(scores as Score[]);

      // Score[] → HoleData[]
      const holes = scoresToHoleData(scores as Score[]);

      // コース詳細を取得
      const courseInfo = roundInfo.courses as unknown as {
        id: string;
        name: string;
        pref: string | null;
      } | null;

      const playedIds = (roundInfo.played_sub_course_ids as string[]) ?? [];

      if (courseInfo?.id) {
        const res = await fetch(`/api/courses/${courseInfo.id}`);
        if (res.ok && !cancelled) {
          const courseDetails: CourseWithDetails = await res.json();
          setSelectedCourse(courseDetails);

          const matchedTee = courseDetails.tees.find((t) => t.name === roundInfo.tee_color);

          updateRoundData({
            courseId: courseInfo.id,
            courseName: courseInfo.name,
            date: roundInfo.date,
            teeColor: roundInfo.tee_color ?? "White",
            teeId: matchedTee?.id ?? null,
            subCourseIds: playedIds,
            holes,
          });
        }
      } else {
        updateRoundData({
          courseId: null,
          courseName: "",
          date: roundInfo.date,
          teeColor: roundInfo.tee_color ?? "White",
          teeId: null,
          subCourseIds: [],
          holes,
        });
      }

      // 直接スコアリング画面へ
      setStep("scoring");
    })();

    return () => {
      cancelled = true;
    };
  }, [editRoundId, member]); // eslint-disable-line react-hooks/exhaustive-deps

  // 自動保存: step/currentHole/roundData 変更時に localStorage へ保存（追加モードでは無効）
  useEffect(() => {
    if (!isDirty.current || addToRoundId || editRoundId) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveDraft({ step, currentHole, roundData });
    }, 500);
  }, [step, currentHole, roundData, addToRoundId]);

  // ページ離脱時の警告
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearTimeout(saveTimeout.current);
    };
  }, []);

  // setRoundData のラッパー（isDirty フラグを立てる）
  const updateRoundData: typeof setRoundData = useCallback((action) => {
    isDirty.current = true;
    setRoundData(action);
  }, []);

  // コース選択時のコールバック
  const handleCourseSelect = useCallback(
    (course: CourseWithDetails | null) => {
      setSelectedCourse(course);
      if (course) {
        updateRoundData((prev) => ({
          ...prev,
          courseId: course.id,
          courseName: course.name,
          teeColor: "",
          teeId: null,
          subCourseIds: [],
          holes: [],
        }));
        setCurrentHole(1);
      } else {
        updateRoundData((prev) => ({
          ...prev,
          courseId: null,
          courseName: "",
          teeId: null,
          subCourseIds: [],
          holes: createInitialHoles(),
        }));
        setCurrentHole(1);
      }
    },
    [updateRoundData]
  );

  const handleManualInput = useCallback(
    (name: string) => {
      updateRoundData((prev) => ({
        ...prev,
        courseId: null,
        courseName: name,
      }));
    },
    [updateRoundData]
  );

  const handleSubCourseAdd = useCallback(
    (subCourseId: string) => {
      if (!selectedCourse) return;

      updateRoundData((prev) => {
        const newIds = [...prev.subCourseIds, subCourseId];

        const selectedTee = selectedCourse.tees.find((t) => t.id === prev.teeId);
        const teeName = selectedTee?.name ?? null;

        const newHoles = createHolesFromCourse(
          selectedCourse.sub_courses,
          newIds,
          teeName,
          prev.holes
        );

        return {
          ...prev,
          subCourseIds: newIds,
          holes: newHoles,
        };
      });
    },
    [selectedCourse, updateRoundData]
  );

  const handleSubCourseRemove = useCallback(
    (index: number) => {
      if (!selectedCourse) return;

      updateRoundData((prev) => {
        const newIds = prev.subCourseIds.filter((_, i) => i !== index);

        const selectedTee = selectedCourse.tees.find((t) => t.id === prev.teeId);
        const teeName = selectedTee?.name ?? null;

        const newHoles = createHolesFromCourse(
          selectedCourse.sub_courses,
          newIds,
          teeName,
          prev.holes
        );

        return {
          ...prev,
          subCourseIds: newIds,
          holes: newHoles,
        };
      });
      setCurrentHole(1);
    },
    [selectedCourse, updateRoundData]
  );

  const handleSubCourseReorder = useCallback(
    (reorderedIds: string[]) => {
      if (!selectedCourse) return;

      updateRoundData((prev) => {
        const selectedTee = selectedCourse.tees.find((t) => t.id === prev.teeId);
        const teeName = selectedTee?.name ?? null;

        const newHoles = createHolesFromCourse(
          selectedCourse.sub_courses,
          reorderedIds,
          teeName,
          prev.holes
        );

        return {
          ...prev,
          subCourseIds: reorderedIds,
          holes: newHoles,
        };
      });
      setCurrentHole(1);
    },
    [selectedCourse, updateRoundData]
  );

  const handleTeeSelect = useCallback(
    (teeId: string) => {
      if (!selectedCourse) return;

      const tee = selectedCourse.tees.find((t) => t.id === teeId);
      if (!tee) return;

      updateRoundData((prev) => {
        const newHoles = createHolesFromCourse(
          selectedCourse.sub_courses,
          prev.subCourseIds,
          tee.name,
          prev.holes
        );

        return {
          ...prev,
          teeId: teeId,
          teeColor: tee.name,
          holes: newHoles,
        };
      });
    },
    [selectedCourse, updateRoundData]
  );

  const handleDateChange = useCallback(
    (date: string) => {
      updateRoundData((prev) => ({ ...prev, date }));
    },
    [updateRoundData]
  );

  const handleTeeColorChange = useCallback(
    (teeColor: string) => {
      updateRoundData((prev) => ({ ...prev, teeColor }));
    },
    [updateRoundData]
  );

  const handleUpdateHole = useCallback(
    (updatedHole: HoleData) => {
      updateRoundData((prev) => ({
        ...prev,
        holes: prev.holes.map((h) => (h.holeNumber === updatedHole.holeNumber ? updatedHole : h)),
      }));
    },
    [updateRoundData]
  );

  /** 保存前の確認チェック → 警告があれば確認ダイアログ、なければそのまま保存 */
  const handleSaveRequest = useCallback(() => {
    setError("");

    // 致命的エラー（確認不要、即ブロック）
    if (!roundData.courseName) {
      setError("コース名を入力してください");
      return;
    }
    const playedHoles = roundData.holes.filter((h) => h.shots.length > 0);
    if (playedHoles.length === 0) {
      setError("少なくとも1ホール分のショットを入力してください");
      return;
    }

    // 警告（確認を促すが保存は可能）
    const warnings: string[] = [];
    const totalHoles = roundData.holes.length;
    const emptyHoles = roundData.holes.filter((h) => h.shots.length === 0);

    if (playedHoles.length % 9 !== 0) {
      warnings.push(
        `${playedHoles.length}ホール分のみ保存されます（${totalHoles}H中${playedHoles.length}H入力済み）。日没了承などで問題なければこのまま保存できます。`
      );
    }

    if (emptyHoles.length > 0 && playedHoles.length % 9 === 0) {
      // 9の倍数だけど途中に歯抜けがある場合
      const emptyNums = emptyHoles.map((h) => h.holeNumber);
      warnings.push(
        `ホール ${emptyNums.join(", ")} が未入力です。未入力ホールはスキップして保存されます。`
      );
    }

    if (warnings.length > 0) {
      setSaveConfirm({ warnings });
    } else {
      executeSave();
    }
  }, [roundData]);

  /** 実際のDB保存処理 */
  const executeSave = async () => {
    if (!member) return;
    setSaveConfirm(null);
    setError("");
    setIsSaving(true);

    try {
      const playedHoles = roundData.holes.filter((h) => h.shots.length > 0);
      const aggregated = playedHoles.map((hole) => aggregateHoleData(hole));

      if (addToRoundId) {
        // ======== 追加モード: 既存ラウンドにスコア追加 ========
        // サブコース名を取得（ext_course_labelsに使用）
        const subCourseNames = roundData.subCourseIds
          .map((scId) => {
            const sc = selectedCourse?.sub_courses.find((s) => s.id === scId);
            return sc?.name ?? null;
          })
          .filter((n): n is string => n !== null);
        const courseLabel = subCourseNames[0] ?? "追加";

        // 追加モード用の course_hole_id マッピング
        const addCourseHoleIdMap = selectedCourse
          ? buildCourseHoleIdMap(
              selectedCourse.sub_courses,
              roundData.subCourseIds,
              addModeHoleOffset
            )
          : new Map<number, string>();

        const scores = aggregated.map((agg) => ({
          par: agg.par,
          score: agg.score,
          putts: agg.putts,
          fairway_result: agg.fairway_result,
          ob: agg.ob,
          bunker: agg.bunker,
          penalty: agg.penalty,
          distance: agg.distance,
          pin_position: agg.pin_position,
          shots_detail: agg.shots_detail,
          course_hole_id: addCourseHoleIdMap.get(agg.hole_number) ?? null,
        }));

        const res = await authFetch(`/api/rounds/${addToRoundId}/scores`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scores,
            course_label: courseLabel,
            sub_course_ids: roundData.subCourseIds,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "保存に失敗しました");
        }

        router.push(`/my-stats/rounds/${addToRoundId}`);
      } else if (editRoundId) {
        // ======== 編集モード: 既存スコアを更新 ========
        for (const agg of aggregated) {
          // hole_numberで対応する既存スコアのIDを見つける
          const existingScore = editScores.find((s) => s.hole_number === agg.hole_number);
          if (!existingScore) continue;

          const res = await authFetch(`/api/rounds/${editRoundId}/scores`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              score_id: existingScore.id,
              score: agg.score,
              putts: agg.putts,
              fairway_result: agg.fairway_result,
              ob: agg.ob,
              bunker: agg.bunker,
              penalty: agg.penalty,
              pin_position: agg.pin_position,
              shots_detail: agg.shots_detail,
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || `ホール${agg.hole_number}の更新に失敗しました`);
          }
        }

        router.push(`/my-stats/rounds/${editRoundId}`);
      } else {
        // ======== 通常モード: 新規ラウンド作成 ========
        // course_id の解決
        let courseId: string | null = roundData.courseId;
        if (!courseId && roundData.courseName) {
          const { data: existingCourse } = await supabase
            .from("courses")
            .select("id")
            .eq("name", roundData.courseName)
            .single();
          courseId = existingCourse?.id ?? null;
        }

        // サブコース名を解決
        const subCourseNames = roundData.subCourseIds
          .map((scId) => {
            const sc = selectedCourse?.sub_courses.find((s) => s.id === scId);
            return sc?.name ?? null;
          })
          .filter((n): n is string => n !== null);
        // サブコースが未登録/未選択の場合はデフォルトで OUT / IN をセット
        const holeCount = aggregated.length;
        const outCourseName = subCourseNames[0] ?? (holeCount > 0 ? "OUT" : null);
        const inCourseName =
          subCourseNames.length > 1
            ? subCourseNames.slice(1).join(" / ")
            : holeCount > 9
              ? "IN"
              : null;

        // rounds テーブルに insert（旧カラム + 新カラム両方書き）
        const { data: round, error: roundError } = await supabase
          .from("rounds")
          .insert({
            member_id: member.id,
            course_id: courseId,
            date: roundData.date,
            tee_color: roundData.teeColor,
            out_course_name: outCourseName,
            in_course_name: inCourseName,
            played_sub_course_ids: roundData.subCourseIds,
          })
          .select()
          .single();

        if (roundError) throw roundError;

        // スコアバリデーション
        const validationErrors = validateScores(aggregated);
        if (validationErrors.length > 0) {
          await supabase.from("rounds").delete().eq("id", round.id);
          setError(validationErrors.map((e) => e.message).join("\n"));
          setIsSaving(false);
          return;
        }

        // course_hole_id マッピングを構築
        const courseHoleIdMap = selectedCourse
          ? buildCourseHoleIdMap(selectedCourse.sub_courses, roundData.subCourseIds)
          : new Map<number, string>();

        // scores テーブルに一括 insert（course_hole_id 付き）
        const scoreRecords = aggregated.map((agg) => ({
          round_id: round.id,
          hole_number: agg.hole_number,
          par: agg.par,
          distance: agg.distance,
          score: agg.score,
          putts: agg.putts,
          fairway_result: agg.fairway_result,
          ob: agg.ob,
          bunker: agg.bunker,
          penalty: agg.penalty,
          pin_position: agg.pin_position,
          shots_detail: agg.shots_detail,
          course_hole_id: courseHoleIdMap.get(agg.hole_number) ?? null,
        }));

        const { error: scoresError } = await supabase.from("scores").insert(scoreRecords);

        if (scoresError) throw scoresError;

        clearDraft();
        router.push("/my-stats");
      }
    } catch (err) {
      if (!navigator.onLine || isNetworkError(err)) {
        // Offline: queue for later sync
        const playedHoles2 = roundData.holes.filter((h) => h.shots.length > 0);
        const agg = playedHoles2.map((hole) => aggregateHoleData(hole));

        if (addToRoundId) {
          const scNames = roundData.subCourseIds
            .map((scId) => {
              const sc = selectedCourse?.sub_courses.find((s) => s.id === scId);
              return sc?.name ?? null;
            })
            .filter((n): n is string => n !== null);

          enqueue("add-scores", {
            roundId: addToRoundId,
            scores: agg.map((a) => ({
              par: a.par,
              score: a.score,
              putts: a.putts,
              fairway_result: a.fairway_result,
              ob: a.ob,
              bunker: a.bunker,
              penalty: a.penalty,
              distance: a.distance,
              pin_position: a.pin_position,
              shots_detail: a.shots_detail,
            })),
            courseLabel: scNames[0] ?? "追加",
          } satisfies AddScoresPayload);
        } else {
          const scNames = roundData.subCourseIds
            .map((scId) => {
              const sc = selectedCourse?.sub_courses.find((s) => s.id === scId);
              return sc?.name ?? null;
            })
            .filter((n): n is string => n !== null);

          const offlineCourseHoleIdMap = selectedCourse
            ? buildCourseHoleIdMap(selectedCourse.sub_courses, roundData.subCourseIds)
            : new Map<number, string>();

          enqueue("create-round", {
            memberId: member.id,
            courseName: roundData.courseName,
            courseId: roundData.courseId,
            date: roundData.date,
            teeColor: roundData.teeColor,
            outCourseName: scNames[0] ?? null,
            inCourseName: scNames.length > 1 ? scNames.slice(1).join(" / ") : null,
            imageUrl: null,
            playedSubCourseIds: roundData.subCourseIds,
            scores: agg.map((a) => ({
              hole_number: a.hole_number,
              par: a.par,
              distance: a.distance,
              score: a.score,
              putts: a.putts,
              fairway_result: a.fairway_result,
              ob: a.ob,
              bunker: a.bunker,
              penalty: a.penalty,
              pin_position: a.pin_position,
              shots_detail: a.shots_detail,
              course_hole_id: offlineCourseHoleIdMap.get(a.hole_number) ?? null,
            })),
          } satisfies CreateRoundPayload);
        }

        clearDraft();
        router.push(addToRoundId ? `/my-stats/rounds/${addToRoundId}` : "/my-stats");
        return;
      }

      console.error(err);
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setShowResetDialog(true);
  };

  const executeReset = () => {
    setShowResetDialog(false);
    setRoundData((prev) => ({
      ...prev,
      holes: createInitialHoles(),
    }));
    setCurrentHole(1);
  };

  // 中断: localStorageに保存して離脱（追加/編集モードでは保存しない）
  const handleSuspend = useCallback(() => {
    if (editRoundId) {
      router.push(`/my-stats/rounds/${editRoundId}`);
    } else if (addToRoundId) {
      router.push(`/my-stats/rounds/${addToRoundId}`);
    } else {
      saveDraft({ step, currentHole, roundData });
      router.push("/input");
    }
  }, [step, currentHole, roundData, router, addToRoundId, editRoundId]);

  // 破棄: データを消して離脱
  const handleDiscard = useCallback(() => {
    setShowDiscardDialog(true);
  }, []);

  const executeDiscard = useCallback(() => {
    setShowDiscardDialog(false);
    if (editRoundId) {
      router.push(`/my-stats/rounds/${editRoundId}`);
    } else if (addToRoundId) {
      router.push(`/my-stats/rounds/${addToRoundId}`);
    } else {
      clearDraft();
      router.push("/input");
    }
  }, [router, addToRoundId, editRoundId]);

  // ドラフト復元
  const handleResumeDraft = useCallback(() => {
    const draft = loadDraft();
    if (draft) {
      setStep(draft.step);
      setCurrentHole(draft.currentHole);
      setRoundData(draft.roundData);
      // Note: selectedCourse はlocalStorageに保存しないため
      // コース選択はStep 1に戻って行う必要がある場合がある
      setDraftInfo(null);
    }
  }, []);

  const handleDiscardDraft = useCallback(() => {
    setShowDraftDiscardDialog(true);
  }, []);

  const executeDiscardDraft = useCallback(() => {
    setShowDraftDiscardDialog(false);
    clearDraft();
    setDraftInfo(null);
  }, []);

  const handleOptionalFieldsChange = useCallback((fields: OptionalFieldSettings) => {
    setOptionalFields(fields);
    try {
      localStorage.setItem(OPTIONAL_FIELDS_KEY, JSON.stringify(fields));
    } catch {
      // ignore
    }
  }, []);

  const dialogs = (
    <>
      <ConfirmDialog
        open={showDiscardDialog}
        onOpenChange={setShowDiscardDialog}
        title="入力内容を破棄しますか？"
        description="現在の入力内容はすべて失われます。この操作は取り消せません。"
        confirmLabel="破棄する"
        variant="destructive"
        onConfirm={executeDiscard}
      />
      <ConfirmDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title="入力内容をリセットしますか？"
        description="全ホールのショットデータがクリアされます。"
        confirmLabel="リセット"
        variant="destructive"
        onConfirm={executeReset}
      />
      <ConfirmDialog
        open={showDraftDiscardDialog}
        onOpenChange={setShowDraftDiscardDialog}
        title="中断データを破棄しますか？"
        description="保存されていた下書きデータが削除されます。この操作は取り消せません。"
        confirmLabel="破棄する"
        variant="destructive"
        onConfirm={executeDiscardDraft}
      />
    </>
  );

  if (step === "settings") {
    return (
      <>
        <StepSettings
          roundData={roundData}
          selectedCourse={selectedCourse}
          draftInfo={addToRoundId || editRoundId ? null : draftInfo}
          optionalFields={optionalFields}
          isAddMode={!!addToRoundId}
          addModeReady={addModeReady}
          onOptionalFieldsChange={handleOptionalFieldsChange}
          onCourseSelect={handleCourseSelect}
          onManualInput={handleManualInput}
          onSubCourseAdd={handleSubCourseAdd}
          onSubCourseRemove={handleSubCourseRemove}
          onSubCourseReorder={handleSubCourseReorder}
          onTeeSelect={handleTeeSelect}
          onDateChange={handleDateChange}
          onTeeColorChange={handleTeeColorChange}
          onStartScoring={() => setStep("scoring")}
          onResumeDraft={handleResumeDraft}
          onDiscardDraft={handleDiscardDraft}
        />
        {dialogs}
      </>
    );
  }

  return (
    <>
      <StepScoring
        roundData={roundData}
        selectedCourse={selectedCourse}
        currentHole={currentHole}
        isSaving={isSaving}
        error={error}
        optionalFields={optionalFields}
        saveConfirm={saveConfirm}
        onCurrentHoleChange={setCurrentHole}
        onUpdateHole={handleUpdateHole}
        onSave={handleSaveRequest}
        onSaveConfirm={executeSave}
        onSaveCancel={() => setSaveConfirm(null)}
        onReset={handleReset}
        onBackToSettings={() => setStep("settings")}
        onSuspend={handleSuspend}
        onDiscard={handleDiscard}
      />
      {dialogs}
    </>
  );
}
