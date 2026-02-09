"use client";

import { useState, useCallback } from "react";
import { DetailedRoundData, HoleData, createDefaultHole } from "@/types/shot";
import { CourseWithDetails, SubCourseWithHoles } from "@/types/database";
import { StepSettings } from "./components/step-settings";
import { StepScoring } from "./components/step-scoring";

type InputStep = "settings" | "scoring";

// 初期状態：18ホール分
function createInitialHoles(): HoleData[] {
  const defaultPars: (3 | 4 | 5)[] = [4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5];
  return defaultPars.map((par, i) => createDefaultHole(i + 1, par));
}

/** コースデータからホールを生成 */
function createHolesFromCourse(
  subCourses: SubCourseWithHoles[],
  selectedSubCourseIds: string[],
  teeName: string | null
): HoleData[] {
  const holes: HoleData[] = [];
  let holeNum = 1;
  for (const sc of subCourses) {
    if (!selectedSubCourseIds.includes(sc.id)) continue;
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

export default function DetailedInputPage() {
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

  const handleSubCourseToggle = useCallback((subCourseId: string) => {
    if (!selectedCourse) return;

    setRoundData((prev) => {
      const newIds = prev.subCourseIds.includes(subCourseId)
        ? prev.subCourseIds.filter((id) => id !== subCourseId)
        : [...prev.subCourseIds, subCourseId];

      const sortedIds = selectedCourse.sub_courses
        .filter((sc) => newIds.includes(sc.id))
        .map((sc) => sc.id);

      const selectedTee = selectedCourse.tees.find((t) => t.id === prev.teeId);
      const teeName = selectedTee?.name ?? null;

      const newHoles = createHolesFromCourse(
        selectedCourse.sub_courses,
        sortedIds,
        teeName
      );

      return {
        ...prev,
        subCourseIds: sortedIds,
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

  if (step === "settings") {
    return (
      <StepSettings
        roundData={roundData}
        selectedCourse={selectedCourse}
        onCourseSelect={handleCourseSelect}
        onManualInput={handleManualInput}
        onSubCourseToggle={handleSubCourseToggle}
        onTeeSelect={handleTeeSelect}
        onDateChange={handleDateChange}
        onTeeColorChange={handleTeeColorChange}
        onStartScoring={() => setStep("scoring")}
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
    />
  );
}
