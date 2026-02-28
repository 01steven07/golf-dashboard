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

  const maxAbs =
    mode === "value"
      ? Math.max(...items.map((d) => Math.abs(d.value)), 0.01)
      : 100;

  return (
    <div>
      <h4 className="text-sm font-semibold text-muted-foreground mb-1">
        {title}
      </h4>
      <div className="space-y-0.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center h-7 text-xs">
            <span className="w-16 shrink-0 truncate text-muted-foreground">
              {item.label}
            </span>
            <div className="flex-1 mx-2 h-4 relative">
              {mode === "rate" ? (
                <div className="absolute inset-0 rounded bg-muted">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${Math.min(item.value, 100)}%`,
                      backgroundColor: color,
                      opacity: 0.8,
                    }}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 relative">
                    {item.value < 0 && (
                      <div
                        className="absolute right-0 top-0 h-full rounded-l"
                        style={{
                          width: `${(Math.abs(item.value) / maxAbs) * 100}%`,
                          backgroundColor: color,
                          opacity: 0.8,
                        }}
                      />
                    )}
                  </div>
                  <div className="w-px bg-muted-foreground/30" />
                  <div className="w-1/2 relative">
                    {item.value > 0 && (
                      <div
                        className="absolute left-0 top-0 h-full rounded-r"
                        style={{
                          width: `${(Math.abs(item.value) / maxAbs) * 100}%`,
                          backgroundColor: color,
                          opacity: 0.8,
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
            <span className="w-14 shrink-0 text-right font-medium tabular-nums">
              {format(mode === "rate" ? item.value ?? item.count : item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
