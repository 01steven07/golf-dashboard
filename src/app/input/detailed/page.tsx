"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DetailedRoundData, HoleData, createDefaultHole } from "@/types/shot";
import { CourseWithDetails, SubCourseWithHoles } from "@/types/database";
import { StepSettings } from "./components/step-settings";
import { StepScoring } from "./components/step-scoring";

type InputStep = "settings" | "scoring";

const STORAGE_KEY = "detailed-input-draft";

// 初期状態：18ホール分
function createInitialHoles(): HoleData[] {
  const defaultPars: (3 | 4 | 5)[] = [4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5];
  return defaultPars.map((par, i) => createDefaultHole(i + 1, par));
}

/** コースデータからホールを生成（selectedSubCourseIdsの順序を尊重） */
function createHolesFromCourse(
  subCourses: SubCourseWithHoles[],
  selectedSubCourseIds: string[],
  teeName: string | null
): HoleData[] {
  const holes: HoleData[] = [];
  let holeNum = 1;
  for (const scId of selectedSubCourseIds) {
    const sc = subCourses.find((s) => s.id === scId);
    if (!sc) continue;
    for (const h of sc.holes) {
      const distance = teeName && h.distances[teeName] ? h.distances[teeName] : null;
      holes.push(
        createDefaultHole(
          holeNum,
          (h.par >= 3 && h.par <= 6 ? h.par : 4) as 3 | 4 | 5 | 6
        )
      );
      holes[holes.length - 1].distance = distance;
      holeNum++;
    }
  }
  return holes.length > 0 ? holes : createInitialHoles();
}

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
  const router = useRouter();
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
  const [selectedCourse, setSelectedCourse] = useState<CourseWithDetails | null>(null);
  const [draftInfo, setDraftInfo] = useState<{ courseName: string; date: string } | null>(null);

  // 起動時にドラフトを確認
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setDraftInfo({
        courseName: draft.roundData.courseName,
        date: draft.roundData.date,
      });
    }
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

      setRoundData((prev) => ({
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
      setRoundData((prev) => ({
        ...prev,
        courseId: null,
        courseName: "",
        teeId: null,
        subCourseIds: [],
        holes: createInitialHoles(),
      }));
      setCurrentHole(1);
    }
  }, []);

  const handleManualInput = useCallback((name: string) => {
    setRoundData((prev) => ({
      ...prev,
      courseId: null,
      courseName: name,
    }));
  }, []);

  const handleSubCourseAdd = useCallback((subCourseId: string) => {
    if (!selectedCourse) return;

    setRoundData((prev) => {
      const newIds = [...prev.subCourseIds, subCourseId];

      const selectedTee = selectedCourse.tees.find((t) => t.id === prev.teeId);
      const teeName = selectedTee?.name ?? null;

      const newHoles = createHolesFromCourse(
        selectedCourse.sub_courses,
        newIds,
        teeName
      );

      return {
        ...prev,
        subCourseIds: newIds,
        holes: newHoles,
      };
    });
    setCurrentHole(1);
  }, [selectedCourse]);

  const handleSubCourseRemove = useCallback((index: number) => {
    if (!selectedCourse) return;

    setRoundData((prev) => {
      const newIds = prev.subCourseIds.filter((_, i) => i !== index);

      const selectedTee = selectedCourse.tees.find((t) => t.id === prev.teeId);
      const teeName = selectedTee?.name ?? null;

      const newHoles = createHolesFromCourse(
        selectedCourse.sub_courses,
        newIds,
        teeName
      );

      return {
        ...prev,
        subCourseIds: newIds,
        holes: newHoles,
      };
    });
    setCurrentHole(1);
  }, [selectedCourse]);

  const handleSubCourseReorder = useCallback((reorderedIds: string[]) => {
    if (!selectedCourse) return;

    setRoundData((prev) => {
      const selectedTee = selectedCourse.tees.find((t) => t.id === prev.teeId);
      const teeName = selectedTee?.name ?? null;

      const newHoles = createHolesFromCourse(
        selectedCourse.sub_courses,
        reorderedIds,
        teeName
      );

      return {
        ...prev,
        subCourseIds: reorderedIds,
        holes: newHoles,
      };
    });
    setCurrentHole(1);
  }, [selectedCourse]);

  const handleTeeSelect = useCallback((teeId: string) => {
    if (!selectedCourse) return;

    const tee = selectedCourse.tees.find((t) => t.id === teeId);
    if (!tee) return;

    setRoundData((prev) => {
      const newHoles = createHolesFromCourse(
        selectedCourse.sub_courses,
        prev.subCourseIds,
        tee.name
      );

      return {
        ...prev,
        teeId: teeId,
        teeColor: tee.name,
        holes: newHoles,
      };
    });
    setCurrentHole(1);
  }, [selectedCourse]);

  const handleDateChange = useCallback((date: string) => {
    setRoundData((prev) => ({ ...prev, date }));
  }, []);

  const handleTeeColorChange = useCallback((teeColor: string) => {
    setRoundData((prev) => ({ ...prev, teeColor }));
  }, []);

  const handleUpdateHole = useCallback((updatedHole: HoleData) => {
    setRoundData((prev) => ({
      ...prev,
      holes: prev.holes.map((h) =>
        h.holeNumber === updatedHole.holeNumber ? updatedHole : h
      ),
    }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    console.log("保存データ:", roundData);
    alert("詳細ショットデータの保存は未実装です");
    setIsSaving(false);
  };

  const handleReset = () => {
    if (confirm("入力内容をリセットしますか？")) {
      setRoundData((prev) => ({
        ...prev,
        holes: createInitialHoles(),
      }));
      setCurrentHole(1);
    }
  };

  // 中断: localStorageに保存して離脱
  const handleSuspend = useCallback(() => {
    saveDraft({ step, currentHole, roundData });
    router.push("/input");
  }, [step, currentHole, roundData, router]);

  // 破棄: データを消して離脱
  const handleDiscard = useCallback(() => {
    if (confirm("入力内容を破棄しますか？この操作は取り消せません。")) {
      clearDraft();
      router.push("/input");
    }
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
    clearDraft();
    setDraftInfo(null);
  }, []);

  if (step === "settings") {
    return (
      <StepSettings
        roundData={roundData}
        selectedCourse={selectedCourse}
        draftInfo={draftInfo}
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
    );
  }

  return (
    <StepScoring
      roundData={roundData}
      selectedCourse={selectedCourse}
      currentHole={currentHole}
      isSaving={isSaving}
      onCurrentHoleChange={setCurrentHole}
      onUpdateHole={handleUpdateHole}
      onSave={handleSave}
      onReset={handleReset}
      onBackToSettings={() => setStep("settings")}
      onSuspend={handleSuspend}
      onDiscard={handleDiscard}
    />
  );
}
