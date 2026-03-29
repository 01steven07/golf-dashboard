"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { DetailedRoundData, DEFAULT_OPTIONAL_FIELDS } from "@/types/shot";
import { CourseWithDetails, FairwayResult } from "@/types/database";
import { createInitialHoles, createHolesFromCourse } from "@/utils/hole-builder";
import { StepSettings } from "@/app/input/detailed/components/step-settings";
import { SimpleScoring, SimpleHoleScore } from "./components/simple-scoring";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { validateScores } from "@/utils/score-validation";
import { buildCourseHoleIdMap } from "@/utils/resolve-course-holes";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { enqueue, isNetworkError, CreateRoundPayload } from "@/lib/offline-queue";

type InputStep = "settings" | "scoring";

const STORAGE_KEY = "simple-input-draft";

interface SimpleDraftData {
  step: InputStep;
  currentHole: number;
  roundData: DetailedRoundData;
  simpleScores: SimpleHoleScore[];
}

function saveDraft(data: SimpleDraftData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function loadDraft(): SimpleDraftData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as SimpleDraftData;
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

/** HoleData[] → SimpleHoleScore[] 初期化 */
function initSimpleScores(roundData: DetailedRoundData): SimpleHoleScore[] {
  return roundData.holes.map((h) => ({
    holeNumber: h.holeNumber,
    par: h.par,
    distance: h.distance,
    score: 0,
    putts: 0,
    fairwayResult: "keep" as FairwayResult,
    teeClub: null,
    ob: 0,
    bunker: 0,
    penalty: 0,
  }));
}

export default function SimpleInputPage() {
  return (
    <RequireAuth>
      <Suspense>
        <SimpleInputContent />
      </Suspense>
    </RequireAuth>
  );
}

function SimpleInputContent() {
  const router = useRouter();
  const { member } = useAuth();
  const [step, setStep] = useState<InputStep>("settings");
  const [currentHole, setCurrentHole] = useState(1);
  const [roundData, setRoundData] = useState<DetailedRoundData>({
    courseId: null,
    courseName: "",
    date: new Date().toISOString().split("T")[0],
    teeColor: "White",
    teeId: null,
    subCourseIds: [],
    holes: createInitialHoles(),
  });
  const [simpleScores, setSimpleScores] = useState<SimpleHoleScore[]>(() =>
    initSimpleScores({
      courseId: null,
      courseName: "",
      date: "",
      teeColor: "White",
      teeId: null,
      subCourseIds: [],
      holes: createInitialHoles(),
    })
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveConfirm, setSaveConfirm] = useState<{
    warnings: string[];
  } | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithDetails | null>(null);
  const [draftInfo, setDraftInfo] = useState<{
    courseName: string;
    date: string;
  } | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showDraftDiscardDialog, setShowDraftDiscardDialog] = useState(false);

  const isDirty = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Draft check on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setDraftInfo({
        courseName: draft.roundData.courseName,
        date: draft.roundData.date,
      });
    }
  }, []);

  // Auto-save
  useEffect(() => {
    if (!isDirty.current) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveDraft({ step, currentHole, roundData, simpleScores });
    }, 500);
  }, [step, currentHole, roundData, simpleScores]);

  // Beforeunload warning
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

  const updateRoundData: typeof setRoundData = useCallback((action) => {
    isDirty.current = true;
    setRoundData(action);
  }, []);

  // When holes change in roundData, sync simpleScores
  const syncSimpleScores = useCallback((newHoles: DetailedRoundData["holes"]) => {
    setSimpleScores((prev) => {
      return newHoles.map((h) => {
        const existing = prev.find((s) => s.holeNumber === h.holeNumber);
        if (existing) {
          return { ...existing, par: h.par, distance: h.distance };
        }
        return {
          holeNumber: h.holeNumber,
          par: h.par,
          distance: h.distance,
          score: 0,
          putts: 0,
          fairwayResult: "keep" as FairwayResult,
          teeClub: null,
          ob: 0,
          bunker: 0,
          penalty: 0,
        };
      });
    });
  }, []);

  const handleCourseSelect = useCallback(
    (course: CourseWithDetails | null) => {
      setSelectedCourse(course);
      if (course) {
        const allSubCourseIds = course.sub_courses.map((sc) => sc.id);
        const defaultTee = course.tees.length > 0 ? course.tees[0] : null;
        const teeName = defaultTee?.name ?? null;

        const newHoles = createHolesFromCourse(course.sub_courses, allSubCourseIds, teeName);

        updateRoundData((prev) => ({
          ...prev,
          courseId: course.id,
          courseName: course.name,
          teeColor: defaultTee?.name ?? "White",
          teeId: defaultTee?.id ?? null,
          subCourseIds: allSubCourseIds,
          holes: newHoles,
        }));
        syncSimpleScores(newHoles);
        setCurrentHole(1);
      } else {
        const defaultHoles = createInitialHoles();
        updateRoundData((prev) => ({
          ...prev,
          courseId: null,
          courseName: "",
          teeId: null,
          subCourseIds: [],
          holes: defaultHoles,
        }));
        syncSimpleScores(defaultHoles);
        setCurrentHole(1);
      }
    },
    [updateRoundData, syncSimpleScores]
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
        syncSimpleScores(newHoles);
        return { ...prev, subCourseIds: newIds, holes: newHoles };
      });
    },
    [selectedCourse, updateRoundData, syncSimpleScores]
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
        syncSimpleScores(newHoles);
        return { ...prev, subCourseIds: newIds, holes: newHoles };
      });
      setCurrentHole(1);
    },
    [selectedCourse, updateRoundData, syncSimpleScores]
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
        syncSimpleScores(newHoles);
        return { ...prev, subCourseIds: reorderedIds, holes: newHoles };
      });
      setCurrentHole(1);
    },
    [selectedCourse, updateRoundData, syncSimpleScores]
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
        syncSimpleScores(newHoles);
        return { ...prev, teeId, teeColor: tee.name, holes: newHoles };
      });
    },
    [selectedCourse, updateRoundData, syncSimpleScores]
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

  const handleStartScoring = useCallback(() => {
    // Sync simpleScores with current roundData holes
    syncSimpleScores(roundData.holes);
    setStep("scoring");
  }, [roundData.holes, syncSimpleScores]);

  const handleUpdateHole = useCallback((updatedHole: SimpleHoleScore) => {
    isDirty.current = true;
    setSimpleScores((prev) =>
      prev.map((h) => (h.holeNumber === updatedHole.holeNumber ? updatedHole : h))
    );
  }, []);

  const handleSaveRequest = useCallback(() => {
    setError("");

    if (!roundData.courseName) {
      setError("コース名を入力してください");
      return;
    }

    const enteredHoles = simpleScores.filter((h) => h.score > 0);
    if (enteredHoles.length === 0) {
      setError("少なくとも1ホール分のスコアを入力してください");
      return;
    }

    const warnings: string[] = [];
    const totalHoles = simpleScores.length;

    if (enteredHoles.length % 9 !== 0) {
      warnings.push(
        `${enteredHoles.length}ホール分のみ保存されます（${totalHoles}H中${enteredHoles.length}H入力済み）。`
      );
    }

    const emptyInMiddle = simpleScores.filter((h) => h.score === 0);
    if (emptyInMiddle.length > 0 && enteredHoles.length % 9 === 0) {
      const emptyNums = emptyInMiddle.map((h) => h.holeNumber);
      warnings.push(
        `ホール ${emptyNums.join(", ")} が未入力です。未入力ホールはスキップして保存されます。`
      );
    }

    if (warnings.length > 0) {
      setSaveConfirm({ warnings });
    } else {
      executeSave();
    }
  }, [roundData.courseName, simpleScores]); // eslint-disable-line react-hooks/exhaustive-deps

  const executeSave = async () => {
    if (!member) return;
    setSaveConfirm(null);
    setError("");
    setIsSaving(true);

    try {
      const enteredHoles = simpleScores.filter((h) => h.score > 0);

      // Validate
      const validationInput = enteredHoles.map((h) => ({
        hole_number: h.holeNumber,
        par: h.par,
        score: h.score,
        putts: h.putts,
        ob: h.ob,
        bunker: h.bunker,
        penalty: h.penalty,
        distance: h.distance,
      }));

      const validationErrors = validateScores(validationInput);
      if (validationErrors.length > 0) {
        setError(validationErrors.map((e) => e.message).join("\n"));
        setIsSaving(false);
        return;
      }

      // Resolve course_id
      let courseId: string | null = roundData.courseId;
      if (!courseId && roundData.courseName) {
        const { data: existingCourse } = await supabase
          .from("courses")
          .select("id")
          .eq("name", roundData.courseName)
          .single();
        courseId = existingCourse?.id ?? null;
      }

      // Sub-course names
      const subCourseNames = roundData.subCourseIds
        .map((scId) => {
          const sc = selectedCourse?.sub_courses.find((s) => s.id === scId);
          return sc?.name ?? null;
        })
        .filter((n): n is string => n !== null);

      const holeCount = enteredHoles.length;
      const outCourseName = subCourseNames[0] ?? (holeCount > 0 ? "OUT" : null);
      const inCourseName =
        subCourseNames.length > 1
          ? subCourseNames.slice(1).join(" / ")
          : holeCount > 9
            ? "IN"
            : null;

      // Insert round
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

      // course_hole_id mapping
      const courseHoleIdMap = selectedCourse
        ? buildCourseHoleIdMap(selectedCourse.sub_courses, roundData.subCourseIds)
        : new Map<number, string>();

      // Insert scores
      // If tee club is selected, store minimal tee shot in shots_detail
      const scoreRecords = enteredHoles.map((h) => ({
        round_id: round.id,
        hole_number: h.holeNumber,
        par: h.par,
        distance: h.distance,
        score: h.score,
        putts: h.putts,
        fairway_result: h.fairwayResult,
        ob: h.ob,
        bunker: h.bunker,
        penalty: h.penalty,
        pin_position: null,
        shots_detail: h.teeClub
          ? [
              {
                type: "tee",
                club: h.teeClub,
                result: "fairway",
                resultDirection: "center",
                wind: "none",
                rating: 3,
                note: "",
              },
            ]
          : null,
        course_hole_id: courseHoleIdMap.get(h.holeNumber) ?? null,
      }));

      const { error: scoresError } = await supabase.from("scores").insert(scoreRecords);

      if (scoresError) throw scoresError;

      clearDraft();
      isDirty.current = false;
      router.push("/my-stats");
    } catch (err) {
      if (!navigator.onLine || isNetworkError(err)) {
        const enteredHoles = simpleScores.filter((h) => h.score > 0);
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
          scores: enteredHoles.map((h) => ({
            hole_number: h.holeNumber,
            par: h.par,
            distance: h.distance,
            score: h.score,
            putts: h.putts,
            fairway_result: h.fairwayResult,
            ob: h.ob,
            bunker: h.bunker,
            penalty: h.penalty,
            pin_position: null,
            shots_detail: h.teeClub
              ? [
                  {
                    type: "tee",
                    club: h.teeClub,
                    result: "fairway",
                    resultDirection: "center",
                    wind: "none",
                    rating: 3,
                    note: "",
                  },
                ]
              : null,
            course_hole_id: offlineCourseHoleIdMap.get(h.holeNumber) ?? null,
          })),
        } satisfies CreateRoundPayload);

        clearDraft();
        isDirty.current = false;
        router.push("/my-stats");
        return;
      }

      console.error(err);
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuspend = useCallback(() => {
    saveDraft({ step, currentHole, roundData, simpleScores });
    router.push("/input");
  }, [step, currentHole, roundData, simpleScores, router]);

  const handleDiscard = useCallback(() => {
    setShowDiscardDialog(true);
  }, []);

  const executeDiscard = useCallback(() => {
    setShowDiscardDialog(false);
    clearDraft();
    router.push("/input");
  }, [router]);

  const handleResumeDraft = useCallback(() => {
    const draft = loadDraft();
    if (draft) {
      setStep(draft.step);
      setCurrentHole(draft.currentHole);
      setRoundData(draft.roundData);
      setSimpleScores(draft.simpleScores);
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
          draftInfo={draftInfo}
          optionalFields={DEFAULT_OPTIONAL_FIELDS}
          hideOptionalFields
          title="簡易入力"
          onOptionalFieldsChange={() => {}}
          onCourseSelect={handleCourseSelect}
          onManualInput={handleManualInput}
          onSubCourseAdd={handleSubCourseAdd}
          onSubCourseRemove={handleSubCourseRemove}
          onSubCourseReorder={handleSubCourseReorder}
          onTeeSelect={handleTeeSelect}
          onDateChange={handleDateChange}
          onTeeColorChange={handleTeeColorChange}
          onStartScoring={handleStartScoring}
          onResumeDraft={handleResumeDraft}
          onDiscardDraft={handleDiscardDraft}
        />
        {dialogs}
      </>
    );
  }

  return (
    <>
      <SimpleScoring
        holes={simpleScores}
        currentHole={currentHole}
        isSaving={isSaving}
        error={error}
        saveConfirm={saveConfirm}
        selectedCourse={selectedCourse}
        subCourseIds={roundData.subCourseIds}
        onUpdateHole={handleUpdateHole}
        onCurrentHoleChange={setCurrentHole}
        onSave={handleSaveRequest}
        onSaveConfirm={executeSave}
        onSaveCancel={() => setSaveConfirm(null)}
        onBackToSettings={() => setStep("settings")}
        onSuspend={handleSuspend}
        onDiscard={handleDiscard}
      />
      {dialogs}
    </>
  );
}
