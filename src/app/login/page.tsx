"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Member } from "@/types/database";

interface MemberOption {
  id: string;
  name: string;
  grade: number;
}

export default function LoginPage() {
  const router = useRouter();
  const { member: currentMember, login } = useAuth();
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentMember) {
      router.push("/");
    }
  }, [currentMember, router]);

  useEffect(() => {
    async function fetchMembers() {
      const { data, error } = await supabase
        .from("members")
        .select("id, name, grade")
        .order("grade", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.error("Failed to fetch members:", error);
        return;
      }
      setMembers(data ?? []);
    }
    fetchMembers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedMemberId) {
      setError("部員を選択してください");
      return;
    }
    if (pin.length < 4 || pin.length > 8) {
      setError("PINコードは4〜8桁で入力してください");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: selectedMemberId, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "ログインに失敗しました");
        setIsLoading(false);
        return;
      }

      login(data.member as Member);
      router.push("/");
    } catch {
      setError("ログイン処理でエラーが発生しました");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">UT golf score app</CardTitle>
          <p className="text-sm text-muted-foreground">部員を選択してログイン</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member">部員を選択</Label>
              <select
                id="member"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">選択してください</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.grade}年 - {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">PINコード（4〜8桁）</Label>
              <Input
                id="pin"
                type="password"
                maxLength={8}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0000"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">アカウントがない場合は</span>{" "}
            <Link href="/register" className="text-primary hover:underline">
              新規登録
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
