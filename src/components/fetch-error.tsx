"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FetchErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function FetchError({
  message = "データの取得に失敗しました",
  onRetry,
}: FetchErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          再読み込み
        </Button>
      )}
    </div>
  );
}
