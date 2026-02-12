"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

export function MobileHeader() {
  const router = useRouter();
  const { member, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="md:hidden sticky top-0 z-50 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
      <div className="flex items-center justify-between h-12 px-4">
        <h1 className="text-base font-bold tracking-tight">UT golf score app</h1>
        {member && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-sidebar-foreground/70">
              {member.grade}年 {member.name}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
