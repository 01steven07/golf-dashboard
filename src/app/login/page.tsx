"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { verifyPin } from "@/lib/auth";
import { Member } from "@/types/database";

export default function LoginPage() {
  const router = useRouter();
  const { member: currentMember, login } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
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
        .select("*")
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
    if (pin.length !== 4) {
      setError("PINコードは4桁で入力してください");
      return;
    }

    setIsLoading(true);

    const selectedMember = members.find((m) => m.id === selectedMemberId);
    if (!selectedMember) {
      setError("部員が見つかりません");
      setIsLoading(false);
      return;
    }

    if (!verifyPin(selectedMember, pin)) {
      setError("PINコードが正しくありません");
      setIsLoading(false);
      return;
    }

    login(selectedMember);
    router.push("/");
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Golf Dashboard</CardTitle>
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
              <Label htmlFor="pin">PINコード（4桁）</Label>
              <Input
                id="pin"
                type="password"
                maxLength={4}
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
        </CardContent>
      </Card>
    </div>
  );
}
