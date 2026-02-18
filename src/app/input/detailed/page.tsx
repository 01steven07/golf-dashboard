"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DetailedRoundData, HoleData, OptionalFieldSettings, DEFAULT_OPTIONAL_FIELDS } from "@/types/shot";
import { CourseWithDetails } from "@/types/database";
import { createInitialHoles, createHolesFromCourse } from "@/utils/hole-builder";
import { StepSettings } from "./components/step-settings";
import { StepScoring } from "./components/step-scoring";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { aggregateHoleData } from "@/utils/shot-aggregation";
import { validateScores } from "@/utils/score-validation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
      <DetailedInputContent />
    </RequireAuth>
  );
}

function DetailedInputContent() {
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveConfirm, setSaveConfirm] = useState<{ warnings: string[] } | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithDetails | null>(null);
  const [draftInfo, setDraftInfo] = useState<{ courseName: string; date: string } | null>(null);
  const [optionalFields, setOptionalFields] = useState<OptionalFieldSettings>(DEFAULT_OPTIONAL_FIELDS);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDraftDiscardDialog, setShowDraftDiscardDialog] = useState(false);

  const isDirty = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 起動時にドラフトを確認 + optionalFields読み込み
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setDraftInfo({
        courseName: draft.roundData.courseName,
        date: draft.roundData.date,
      });
    }
    try {
      const stored = localStorage.getItem(OPTIONAL_FIELDS_KEY);
      if (stored) {
        setOptionalFields({ ...DEFAULT_OPTIONAL_FIELDS, ...JSON.parse(stored) });
      }
    } catch {
      // ignore
    }
  }, []);

  // 自動保存: step/currentHole/roundData 変更時に localStorage へ保存
  useEffect(() => {
    if (!isDirty.current) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveDraft({ step, currentHole, roundData });
    }, 500);
  }, [step, currentHole, roundData]);

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
  const handleCourseSelect = useCallback((course: CourseWithDetails | null) => {
    setSelectedCourse(course);
    if (course) {
      const allSubCourseIds = course.sub_courses.map((sc) => sc.id);
      const defaultTee = course.tees.length > 0 ? course.tees[0] : null;
      const teeName = defaultTee?.name ?? null;

      const newHoles = createHolesFromCourse(
        course.sub_courses,
        allSubCourseIds,
        teeName
      );

      updateRoundData((prev) => ({
        ...prev,
        courseId: course.id,
        courseName: course.name,
        teeColor: defaultTee?.name ?? "White",
        teeId: defaultTee?.id ?? null,
        subCourseIds: allSubCourseIds,
        holes: newHoles,
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
  }, [updateRoundData]);

  const handleManualInput = useCallback((name: string) => {
    updateRoundData((prev) => ({
      ...prev,
      courseId: null,
      courseName: name,
    }));
  }, [updateRoundData]);

  const handleSubCourseAdd = useCallback((subCourseId: string) => {
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
  }, [selectedCourse, updateRoundData]);

  const handleSubCourseRemove = useCallback((index: number) => {
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
  }, [selectedCourse, updateRoundData]);

  const handleSubCourseReorder = useCallback((reorderedIds: string[]) => {
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
  }, [selectedCourse, updateRoundData]);

  const handleTeeSelect = useCallback((teeId: string) => {
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
  }, [selectedCourse, updateRoundData]);

  const handleDateChange = useCallback((date: string) => {
    updateRoundData((prev) => ({ ...prev, date }));
  }, [updateRoundData]);

  const handleTeeColorChange = useCallback((teeColor: string) => {
    updateRoundData((prev) => ({ ...prev, teeColor }));
  }, [updateRoundData]);

  const handleUpdateHole = useCallback((updatedHole: HoleData) => {
    updateRoundData((prev) => ({
      ...prev,
      holes: prev.holes.map((h) =>
        h.holeNumber === updatedHole.holeNumber ? updatedHole : h
      ),
    }));
  }, [updateRoundData]);

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

      // サブコース名を解決（out/in、3コース以上の場合は2つ目以降を結合）
      const subCourseNames = roundData.subCourseIds.map((scId) => {
        const sc = selectedCourse?.sub_courses.find((s) => s.id === scId);
        return sc?.name ?? null;
      }).filter((n): n is string => n !== null);
      const outCourseName = subCourseNames[0] ?? null;
      const inCourseName = subCourseNames.length > 1
        ? subCourseNames.slice(1).join(" / ")
        : null;

      // rounds テーブルに insert
      const { data: round, error: roundError } = await supabase
        .from("rounds")
        .insert({
          member_id: member.id,
          course_id: courseId,
          date: roundData.date,
          tee_color: roundData.teeColor,
          out_course_name: outCourseName,
          in_course_name: inCourseName,
        })
        .select()
        .single();

      if (roundError) throw roundError;

      // 入力済みホールを集約（未プレーホールは除外）
      const aggregated = playedHoles.map((hole) => aggregateHoleData(hole));

      // スコアバリデーション（DB挿入前に実行）
      const validationErrors = validateScores(aggregated);
      if (validationErrors.length > 0) {
        await supabase.from("rounds").delete().eq("id", round.id);
        setError(validationErrors.map((e) => e.message).join("\n"));
        setIsSaving(false);
        return;
      }

      // scores テーブルに一括 insert
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
      }));

      const { error: scoresError } = await supabase
        .from("scores")
        .insert(scoreRecords);

      if (scoresError) throw scoresError;

      // 成功: ドラフト削除してリダイレクト
      clearDraft();
      router.push("/my-stats");
    } catch (err) {
      console.error(err);
      setError("保存に失敗しました");
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

  // 中断: localStorageに保存して離脱
  const handleSuspend = useCallback(() => {
    saveDraft({ step, currentHole, roundData });
    router.push("/input");
  }, [step, currentHole, roundData, router]);

  // 破棄: データを消して離脱
  const handleDiscard = useCallback(() => {
    setShowDiscardDialog(true);
  }, []);

  const executeDiscard = useCallback(() => {
    setShowDiscardDialog(false);
    clearDraft();
    router.push("/input");
  }, [router]);

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
          draftInfo={draftInfo}
          optionalFields={optionalFields}
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
