"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { Member } from "@/types/database";

export default function RegisterPage() {
  const router = useRouter();
  const { member: currentMember, login } = useAuth();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<number>(1);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentMember) {
      router.push("/");
    }
  }, [currentMember, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("名前を入力してください");
      return;
    }

    if (pin.length < 4 || pin.length > 8) {
      setError("PINコードは4〜8桁で入力してください");
      return;
    }

    if (pin !== pinConfirm) {
      setError("PINコードが一致しません");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), grade, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "登録に失敗しました");
        setIsLoading(false);
        return;
      }

      // Auto login after registration
      login(data.member as Member);
      router.push("/");
    } catch {
      setError("登録処理でエラーが発生しました");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">新規登録</CardTitle>
          <p className="text-sm text-muted-foreground">部員情報を入力してください</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                type="text"
                placeholder="山田 太郎"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
              <Label htmlFor="pin">PINコード（4〜8桁の数字）</Label>
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
            <div className="space-y-2">
              <Label htmlFor="pinConfirm">PINコード（確認）</Label>
              <Input
                id="pinConfirm"
                type="password"
                maxLength={8}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0000"
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "登録中..." : "登録する"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">既にアカウントがある場合は</span>{" "}
            <Link href="/login" className="text-primary hover:underline">
              ログイン
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
