"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RequireAdmin } from "@/components/auth/require-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Shield, ShieldOff, Trash2 } from "lucide-react";
import { Member } from "@/types/database";
import { authFetch } from "@/lib/api-client";

type MemberWithCreatedAt = Member & { created_at: string };

export default function AdminMembersPage() {
  const [members, setMembers] = useState<MemberWithCreatedAt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMembers = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/members");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "部員一覧の取得に失敗しました");
        return;
      }
      setMembers(data.members);
    } catch {
      setError("部員一覧の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleToggleRole = async (member: MemberWithCreatedAt) => {
    const newRole = member.role === "admin" ? "member" : "admin";
    const confirmMessage =
      newRole === "admin"
        ? `${member.name} を管理者に変更しますか？`
        : `${member.name} の管理者権限を解除しますか？`;

    if (!confirm(confirmMessage)) return;

    try {
      const res = await authFetch(`/api/admin/members/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "権限の変更に失敗しました");
        return;
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m))
      );
    } catch {
      alert("権限の変更に失敗しました");
    }
  };

  const handleDelete = async (member: MemberWithCreatedAt) => {
    if (!confirm(`${member.name} を削除しますか？この操作は取り消せません。`))
      return;

    try {
      const res = await authFetch("/api/admin/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "削除に失敗しました");
        return;
      }

      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch {
      alert("削除に失敗しました");
    }
  };

  const gradeLabel = (grade: number) => {
    if (grade <= 4) return `${grade}年`;
    if (grade === 5) return "院1";
    return "院2";
  };

  return (
    <RequireAdmin>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">部員管理</h2>
            <p className="text-sm text-muted-foreground">
              部員の一覧・権限管理・削除
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              部員一覧（{members.length}名）
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">
                読み込み中...
              </p>
            ) : error ? (
              <p className="text-destructive text-center py-8">{error}</p>
            ) : members.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                部員がいません
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名前</TableHead>
                      <TableHead className="w-[60px]">学年</TableHead>
                      <TableHead className="w-[80px]">権限</TableHead>
                      <TableHead className="w-[120px] text-right">
                        操作
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Link
                            href={`/admin/members/${member.id}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {member.name}
                          </Link>
                        </TableCell>
                        <TableCell>{gradeLabel(member.grade)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              member.role === "admin"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {member.role === "admin" ? "管理者" : "部員"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/members/${member.id}`}>
                              <Button variant="ghost" size="icon" title="編集">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              title={
                                member.role === "admin"
                                  ? "管理者権限を解除"
                                  : "管理者に変更"
                              }
                              onClick={() => handleToggleRole(member)}
                            >
                              {member.role === "admin" ? (
                                <ShieldOff className="h-4 w-4" />
                              ) : (
                                <Shield className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="削除"
                              onClick={() => handleDelete(member)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RequireAdmin>
  );
}
