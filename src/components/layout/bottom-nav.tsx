"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Camera, Home, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

const navItems = [
  { href: "/", label: "ランキング", icon: Home },
  { href: "/input", label: "入力", icon: Camera },
  { href: "/my-stats", label: "マイ", icon: BarChart3 },
  { href: "/admin", label: "管理", icon: User, adminOnly: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { member } = useAuth();

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || member?.role === "admin"
  );

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16">
        {filteredNavItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
