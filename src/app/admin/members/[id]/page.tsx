"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RequireAdmin } from "@/components/auth/require-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClubSetEditor } from "@/components/club-set-editor";
import { ArrowLeft, Save } from "lucide-react";
import {
  ClubType,
  Gender,
  MemberRole,
  PreferredTee,
} from "@/types/database";
import { authFetch } from "@/lib/api-client";

export default function AdminMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;

  const [name, setName] = useState("");
  const [grade, setGrade] = useState<number>(1);
  const [gender, setGender] = useState<Gender>("male");
  const [role, setRole] = useState<MemberRole>("member");
  const [preferredTee, setPreferredTee] = useState<PreferredTee>("white");
  const [clubs, setClubs] = useState<ClubType[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMember = useCallback(async () => {
    try {
      const res = await authFetch(`/api/admin/members/${memberId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "部員情報の取得に失敗しました");
        return;
      }
      const m = data.member;
      setName(m.name);
      setGrade(m.grade);
      setGender(m.gender || "male");
      setRole(m.role);
      setPreferredTee(m.preferred_tee || "white");
      setClubs(m.clubs || []);
    } catch {
      setError("部員情報の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const res = await authFetch(`/api/admin/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          grade,
          gender,
          role,
          preferred_tee: preferredTee,
          clubs,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "更新に失敗しました");
        return;
      }

      setSuccess("保存しました");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <RequireAdmin>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/members">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">部員編集</h2>
            <p className="text-sm text-muted-foreground">
              部員情報の確認・編集
            </p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">
            読み込み中...
          </p>
        ) : error && !name ? (
          <p className="text-destructive text-center py-8">{error}</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">基本情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">名前</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">学年</Label>
                    <select
                      id="grade"
                      value={grade}
                      onChange={(e) => setGrade(Number(e.target.value))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value={1}>1年</option>
                      <option value={2}>2年</option>
                      <option value={3}>3年</option>
                      <option value={4}>4年</option>
                      <option value={5}>5年（院1）</option>
                      <option value={6}>6年（院2）</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">性別</Label>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="male">男性</option>
                      <option value="female">女性</option>
                      <option value="other">その他</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">権限</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as MemberRole)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="member">部員</option>
                    <option value="admin">管理者</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>利用ティー</Label>
                  <div className="flex gap-2">
                    {[
                      {
                        value: "black",
                        label: "黒",
                        color: "bg-gray-800 text-white",
                      },
                      {
                        value: "blue",
                        label: "青",
                        color: "bg-blue-500 text-white",
                      },
                      {
                        value: "white",
                        label: "白",
                        color:
                          "bg-white text-gray-800 border-2 border-gray-300",
                      },
                      {
                        value: "red",
                        label: "赤",
                        color: "bg-red-500 text-white",
                      },
                      {
                        value: "green",
                        label: "緑",
                        color: "bg-green-500 text-white",
                      },
                    ].map((tee) => (
                      <button
                        key={tee.value}
                        type="button"
                        onClick={() =>
                          setPreferredTee(tee.value as PreferredTee)
                        }
                        className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${tee.color} ${
                          preferredTee === tee.value
                            ? "ring-2 ring-offset-2 ring-primary"
                            : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        {tee.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">クラブセット</CardTitle>
              </CardHeader>
              <CardContent>
                <ClubSetEditor value={clubs} onChange={setClubs} />
              </CardContent>
            </Card>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <p className="text-sm text-green-600">{success}</p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/members")}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "保存中..." : "保存する"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </RequireAdmin>
  );
}
