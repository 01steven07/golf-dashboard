"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CourseFormData,
  TeeFormData,
  SubCourseFormData,
  HoleFormData,
} from "@/types/course";
import { CourseHoleTable } from "./course-hole-table";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Loader2,
  Globe,
  Save,
} from "lucide-react";

const PREFS = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

function createDefaultHoles(count: number): HoleFormData[] {
  return Array.from({ length: count }, (_, i) => ({
    hole_number: i + 1,
    par: 4 as 3 | 4 | 5 | 6,
    handicap: null,
    distances: {},
  }));
}

interface CourseFormProps {
  initialData?: CourseFormData;
  courseId?: string;
}

export function CourseForm({ initialData, courseId }: CourseFormProps) {
  const router = useRouter();
  const isEdit = !!courseId;

  const [formData, setFormData] = useState<CourseFormData>(
    initialData ?? {
      name: "",
      pref: "",
      source_url: "",
      green_types: [],
      tees: [
        { name: "バック", color: "Blue", sort_order: 0 },
        { name: "レギュラー", color: "White", sort_order: 1 },
      ],
      sub_courses: [
        {
          name: "OUT",
          hole_count: 9,
          sort_order: 0,
          holes: createDefaultHoles(9),
        },
        {
          name: "IN",
          hole_count: 9,
          sort_order: 1,
          holes: createDefaultHoles(9),
        },
      ],
    }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teeNames = formData.tees.map((t) => t.name);

  // --- ティー操作 ---
  const addTee = () => {
    setFormData({
      ...formData,
      tees: [
        ...formData.tees,
        { name: "", color: "", sort_order: formData.tees.length },
      ],
    });
  };

  const updateTee = (index: number, field: keyof TeeFormData, value: string | number) => {
    const updated = [...formData.tees];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, tees: updated });
  };

  const removeTee = (index: number) => {
    setFormData({
      ...formData,
      tees: formData.tees.filter((_, i) => i !== index),
    });
  };

  // --- サブコース操作 ---
  const addSubCourse = () => {
    const newSc: SubCourseFormData = {
      name: "",
      hole_count: 9,
      sort_order: formData.sub_courses.length,
      holes: createDefaultHoles(9),
    };
    setFormData({
      ...formData,
      sub_courses: [...formData.sub_courses, newSc],
    });
  };

  const updateSubCourse = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updated = [...formData.sub_courses];
    if (field === "hole_count") {
      const newCount = Number(value);
      const currentHoles = updated[index].holes;
      let newHoles: HoleFormData[];
      if (newCount > currentHoles.length) {
        newHoles = [
          ...currentHoles,
          ...createDefaultHoles(newCount - currentHoles.length).map((h, i) => ({
            ...h,
            hole_number: currentHoles.length + i + 1,
          })),
        ];
      } else {
        newHoles = currentHoles.slice(0, newCount);
      }
      updated[index] = {
        ...updated[index],
        hole_count: newCount,
        holes: newHoles,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setFormData({ ...formData, sub_courses: updated });
  };

  const removeSubCourse = (index: number) => {
    setFormData({
      ...formData,
      sub_courses: formData.sub_courses.filter((_, i) => i !== index),
    });
  };

  const updateSubCourseHoles = (index: number, holes: HoleFormData[]) => {
    const updated = [...formData.sub_courses];
    updated[index] = { ...updated[index], holes };
    setFormData({ ...formData, sub_courses: updated });
  };

  // --- グリーン種類 ---
  const toggleGreenType = (type: string) => {
    const current = formData.green_types;
    if (current.includes(type)) {
      setFormData({
        ...formData,
        green_types: current.filter((t) => t !== type),
      });
    } else {
      setFormData({ ...formData, green_types: [...current, type] });
    }
  };

  // --- スクレイピング ---
  const handleScrape = async () => {
    if (!formData.source_url) return;
    setIsScraping(true);
    setError(null);

    try {
      const res = await fetch("/api/courses/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formData.source_url }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "スクレイピングに失敗しました");
        return;
      }

      const result = await res.json();

      // スクレイピング結果をフォームに反映
      setFormData({
        ...formData,
        name: result.course_name || formData.name,
        pref: result.pref || formData.pref,
        green_types:
          result.green_types.length > 0
            ? result.green_types
            : formData.green_types,
        tees:
          result.tees.length > 0
            ? result.tees.map((name: string, i: number) => ({
                name,
                color: "",
                sort_order: i,
              }))
            : formData.tees,
        sub_courses:
          result.sub_courses.length > 0
            ? result.sub_courses.map(
                (
                  sc: {
                    name: string;
                    holes: {
                      hole_number: number;
                      par: number;
                      handicap: number | null;
                      distances: Record<string, number>;
                    }[];
                  },
                  i: number
                ) => ({
                  name: sc.name,
                  hole_count: sc.holes.length,
                  sort_order: i,
                  holes: sc.holes.map((h) => ({
                    hole_number: h.hole_number,
                    par: (h.par >= 3 && h.par <= 6 ? h.par : 4) as
                      | 3
                      | 4
                      | 5
                      | 6,
                    handicap: h.handicap,
                    distances: h.distances || {},
                  })),
                })
              )
            : formData.sub_courses,
      });
    } catch {
      setError("スクレイピングに失敗しました");
    } finally {
      setIsScraping(false);
    }
  };

  // --- 保存 ---
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("コース名を入力してください");
      return;
    }
    if (formData.tees.length === 0) {
      setError("ティーを1つ以上設定してください");
      return;
    }
    if (formData.sub_courses.length === 0) {
      setError("サブコースを1つ以上設定してください");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const url = isEdit ? `/api/courses/${courseId}` : "/api/courses";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "保存に失敗しました");
        return;
      }

      router.push("/courses");
    } catch {
      setError("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* URL スクレイピング */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Webサイトから自動入力
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={formData.source_url}
              onChange={(e) =>
                setFormData({ ...formData, source_url: e.target.value })
              }
              placeholder="ゴルフ場のコース紹介ページURL"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleScrape}
              disabled={!formData.source_url || isScraping}
              variant="outline"
            >
              {isScraping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "取得"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            ゴルフ場のコース紹介ページのURLを入力すると、コース情報を自動で取得します。GORAやGDO、公式ページのコース情報URLがおすすめです
          </p>
        </CardContent>
      </Card>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>コース名 *</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="○○ゴルフクラブ"
            />
          </div>
          <div>
            <Label>都道府県</Label>
            <select
              value={formData.pref}
              onChange={(e) =>
                setFormData({ ...formData, pref: e.target.value })
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">選択してください</option>
              {PREFS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>グリーン種類</Label>
            <div className="flex gap-2 mt-1">
              {["ベント", "高麗", "バミューダ"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleGreenType(type)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    formData.green_types.includes(type)
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ティー設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            ティー設定
            <Button type="button" variant="outline" size="sm" onClick={addTee}>
              <Plus className="w-4 h-4 mr-1" />
              追加
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.tees.map((tee, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={tee.name}
                onChange={(e) => updateTee(i, "name", e.target.value)}
                placeholder="ティー名（例: バック）"
                className="flex-1"
              />
              <Input
                value={tee.color}
                onChange={(e) => updateTee(i, "color", e.target.value)}
                placeholder="色（例: Blue）"
                className="w-24"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeTee(i)}
                disabled={formData.tees.length <= 1}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* サブコース設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            コース構成
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSubCourse}
            >
              <Plus className="w-4 h-4 mr-1" />
              追加
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.sub_courses.map((sc, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={sc.name}
                  onChange={(e) => updateSubCourse(i, "name", e.target.value)}
                  placeholder="コース名（例: OUT）"
                  className="flex-1"
                />
                <div className="flex items-center gap-1">
                  <Label className="text-xs whitespace-nowrap">ホール数</Label>
                  <Input
                    type="number"
                    value={sc.hole_count}
                    onChange={(e) =>
                      updateSubCourse(i, "hole_count", e.target.value)
                    }
                    className="w-16"
                    min={1}
                    max={18}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSubCourse(i)}
                  disabled={formData.sub_courses.length <= 1}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>

              <CourseHoleTable
                subCourseName={sc.name || `コース${i + 1}`}
                holes={sc.holes}
                teeNames={teeNames}
                onChange={(holes) => updateSubCourseHoles(i, holes)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/courses")}
            className="flex-1"
          >
            キャンセル
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? "保存中..." : isEdit ? "更新する" : "登録する"}
          </Button>
        </div>
      </div>
    </div>
  );
}
