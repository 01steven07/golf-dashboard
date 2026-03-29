"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/api-client";
import ReactMarkdown from "react-markdown";

interface RoundAdviceButtonProps {
  roundId: string;
}

export function RoundAdviceButton({ roundId }: RoundAdviceButtonProps) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/rounds/${roundId}/advice`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "生成に失敗しました");
      }
      const data = await res.json();
      setAdvice(data.advice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!advice && (
        <Button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              AI分析中...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              AI振り返り&アドバイスを生成
            </>
          )}
        </Button>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {advice && (
        <div className="space-y-3">
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div
              className="prose prose-sm max-w-none
              prose-headings:text-green-800 prose-headings:text-sm prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-1
              prose-p:text-gray-700 prose-p:my-1 prose-p:leading-relaxed
              prose-li:text-gray-700 prose-li:my-0.5
              prose-ul:my-1 prose-ol:my-1
              prose-strong:text-green-800
            "
            >
              <ReactMarkdown>{advice}</ReactMarkdown>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                再生成中...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-1" />
                再生成
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
