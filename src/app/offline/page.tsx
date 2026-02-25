"use client";

import { WifiOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <WifiOff className="h-16 w-16 text-amber-500 mb-6" />
      <h1 className="text-2xl font-bold mb-2">オフラインです</h1>
      <p className="text-muted-foreground mb-6">
        このページはまだキャッシュされていません。
        <br />
        一度オンラインでアクセスしたページはオフラインでも利用できます。
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.location.reload()}>
          再読み込み
        </Button>
        <Link href="/input/detailed">
          <Button>スコア入力へ</Button>
        </Link>
      </div>
    </div>
  );
}
