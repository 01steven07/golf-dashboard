"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Member } from "@/types/database";
import { getCurrentMember, saveCurrentMember, clearCurrentMember } from "@/lib/auth";

interface AuthContextType {
  member: Member | null;
  isLoading: boolean;
  login: (member: Member) => void;
  logout: () => void;
  updateMember: (updates: Partial<Member>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getCurrentMember();
    setMember(stored);
    setIsLoading(false);
  }, []);

  const login = (m: Member) => {
    saveCurrentMember(m);
    setMember(m);
  };

  const logout = () => {
    clearCurrentMember();
    setMember(null);
  };

  const updateMember = (updates: Partial<Member>) => {
    if (member) {
      const updated = { ...member, ...updates };
      saveCurrentMember(updated);
      setMember(updated);
    }
  };

  return (
    <AuthContext.Provider value={{ member, isLoading, login, logout, updateMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
