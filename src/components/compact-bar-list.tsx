"use client";

interface CompactBarItem {
  label: string;
  value: number;
  count: number;
}

interface CompactBarListProps {
  items: CompactBarItem[];
  title: string;
  /** "rate": 0-100% bar, "value": ±value bar centered on 0 */
  mode: "rate" | "value";
  color?: string;
  valueFormatter?: (v: number) => string;
}

export function CompactBarList({
  items,
  title,
  mode,
  color = "#3b82f6",
  valueFormatter,
}: CompactBarListProps) {
  if (items.length === 0) return null;

  const format =
    valueFormatter ??
    (mode === "rate"
      ? (v: number) => `${v.toFixed(1)}%`
      : (v: number) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)));

  const maxAbs = mode === "value" ? Math.max(...items.map((d) => Math.abs(d.value)), 0.01) : 100;

  return (
    <div>
      <h4 className="text-sm font-semibold text-muted-foreground mb-2">{title}</h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground/60 text-[10px]">n={item.count}</span>
                <span
                  className="font-semibold tabular-nums"
                  style={{
                    color:
                      mode === "value"
                        ? item.value > 0
                          ? "#ef4444"
                          : item.value < 0
                            ? "#22c55e"
                            : undefined
                        : undefined,
                  }}
                >
                  {format(mode === "rate" ? (item.value ?? item.count) : item.value)}
                </span>
              </div>
            </div>
            <div className="h-4 relative">
              {mode === "rate" ? (
                <div className="absolute inset-0 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(Math.min(item.value, 100), 1.5)}%`,
                      backgroundColor: color,
                      opacity: 0.8,
                    }}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex rounded-full bg-muted overflow-hidden">
                  <div className="w-1/2 relative">
                    {item.value <= 0 && (
                      <div
                        className="absolute right-0 top-0 h-full rounded-l-full"
                        style={{
                          width:
                            item.value === 0 ? "2px" : `${(Math.abs(item.value) / maxAbs) * 100}%`,
                          backgroundColor: item.value === 0 ? "var(--muted-foreground)" : "#22c55e",
                          opacity: item.value === 0 ? 0.3 : 0.8,
                        }}
                      />
                    )}
                  </div>
                  <div className="w-px bg-muted-foreground/40 z-10" />
                  <div className="w-1/2 relative">
                    {item.value >= 0 && (
                      <div
                        className="absolute left-0 top-0 h-full rounded-r-full"
                        style={{
                          width:
                            item.value === 0 ? "2px" : `${(Math.abs(item.value) / maxAbs) * 100}%`,
                          backgroundColor: item.value === 0 ? "var(--muted-foreground)" : "#ef4444",
                          opacity: item.value === 0 ? 0.3 : 0.8,
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
