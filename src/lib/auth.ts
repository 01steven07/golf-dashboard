import { Member } from "@/types/database";

const STORAGE_KEY = "golf_dashboard_member";

export function saveCurrentMember(member: Member): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
  }
}

export function getCurrentMember(): Member | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as Member;
  } catch {
    return null;
  }
}

export function clearCurrentMember(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function verifyPin(member: Member, pin: string): boolean {
  return member.pin_code === pin;
}
