"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { member, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !member) {
      router.push("/login");
    }
  }, [member, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!member) {
    return null;
  }

  return <>{children}</>;
}
