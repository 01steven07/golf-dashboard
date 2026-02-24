"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const { isOnline, queueLength } = useOnlineStatus();

  if (isOnline && queueLength === 0) return null;

  if (!isOnline) {
    return (
      <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-sm text-amber-800 flex items-center gap-2">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>オフラインです。データはローカルに保存されます。</span>
      </div>
    );
  }

  // Online but has pending items
  return (
    <div className="bg-blue-100 border-b border-blue-300 px-4 py-2 text-sm text-blue-800 flex items-center gap-2">
      <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
      <span>未送信データを送信中... ({queueLength}件)</span>
    </div>
  );
}
