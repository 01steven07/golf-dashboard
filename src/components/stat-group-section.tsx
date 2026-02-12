"use client";

import { StatCard } from "@/components/stat-card";

interface StatItem {
  label: string;
  value: string;
  description?: string;
  unavailable?: boolean;
}

interface StatGroupSectionProps {
  title: string;
  stats: StatItem[];
}

export function StatGroupSection({ title, stats }: StatGroupSectionProps) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-muted-foreground mb-3">{title}</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            description={stat.description}
            unavailable={stat.unavailable}
          />
        ))}
      </div>
    </div>
  );
}
