"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { Member, ClubType, Gender, PreferredTee } from "@/types/database";
import { ClubSetEditor } from "@/components/club-set-editor";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Step = 1 | 2;

export default function RegisterPage() {
  const router = useRouter();
  const { member: currentMember, login } = useAuth();

  // Step 1: Basic info
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<number>(1);
  const [gender, setGender] = useState<Gender>("male");
  const [preferredTee, setPreferredTee] = useState<PreferredTee>("white");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

  // Step 2: Club set
  const [clubs, setClubs] = useState<ClubType[]>([
    "1W", "3W", "5W", "UT5", "5I", "6I", "7I", "8I", "9I", "PW", "50", "54", "58", "PT"
  ]);

  // UI state
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentMember) {
      router.push("/");
    }
  }, [currentMember, router]);

  const validateStep1 = (): boolean => {
    setError("");

    if (!name.trim()) {
      setError("名前を入力してください");
      return false;
    }

    if (pin.length < 4 || pin.length > 8) {
      setError("PINコードは4〜8桁で入力してください");
      return false;
    }

    if (pin !== pinConfirm) {
      setError("PINコードが一致しません");
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      setError("");
    }
  };

  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      handleNextStep();
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          grade,
          gender,
          preferred_tee: preferredTee,
          pin,
          clubs,
        }),
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
    <div className="flex items-center justify-center min-h-[80vh] py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">新規登録</CardTitle>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className={`w-3 h-3 rounded-full ${step >= 1 ? "bg-primary" : "bg-gray-300"}`} />
            <div className="w-8 h-0.5 bg-gray-300" />
            <div className={`w-3 h-3 rounded-full ${step >= 2 ? "bg-primary" : "bg-gray-300"}`} />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {step === 1 ? "Step 1: 基本情報" : "Step 2: クラブセット"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
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
                  <Label htmlFor="preferredTee">利用ティー</Label>
                  <div className="flex gap-2">
                    {[
                      { value: "black", label: "黒", color: "bg-gray-800 text-white" },
                      { value: "blue", label: "青", color: "bg-blue-500 text-white" },
                      { value: "white", label: "白", color: "bg-white text-gray-800 border-2 border-gray-300" },
                      { value: "red", label: "赤", color: "bg-red-500 text-white" },
                      { value: "green", label: "緑", color: "bg-green-500 text-white" },
                    ].map((tee) => (
                      <button
                        key={tee.value}
                        type="button"
                        onClick={() => setPreferredTee(tee.value as PreferredTee)}
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
              </>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <Label>持っているクラブを選択</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  スコア入力時に使うクラブを選択してください（後から編集可能）
                </p>
                <ClubSetEditor value={clubs} onChange={setClubs} />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  戻る
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {step === 1 ? (
                  <>
                    次へ
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                ) : isLoading ? (
                  "登録中..."
                ) : (
                  "登録する"
                )}
              </Button>
            </div>
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
