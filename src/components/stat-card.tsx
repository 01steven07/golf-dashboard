"use client";

import { useState } from "react";
import { Info } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  description?: string;
  unavailable?: boolean;
}

export function StatCard({ label, value, description, unavailable }: StatCardProps) {
  const [showDescription, setShowDescription] = useState(false);

  return (
    <div
      className={`p-4 rounded-lg relative ${
        unavailable ? "bg-muted/30 opacity-50" : "bg-muted/50"
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        {description && (
          <button
            type="button"
            onClick={() => setShowDescription(!showDescription)}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="text-2xl font-bold mt-1">
        {unavailable ? "-" : value}
      </p>
      {showDescription && description && (
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          {description}
        </p>
      )}
      {unavailable && (
        <p className="text-xs text-muted-foreground mt-1">詳細入力データが必要です</p>
      )}
    </div>
  );
}
