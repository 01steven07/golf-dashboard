import { NextRequest, NextResponse } from "next/server";
import { supabase } from "./supabase";
import { Member } from "@/types/database";

/**
 * リクエストヘッダーからログインユーザーを取得・検証する。
 * x-member-id ヘッダーが必須。DBに存在しなければ null を返す。
 */
export async function getAuthMember(
  request: NextRequest
): Promise<Member | null> {
  const memberId = request.headers.get("x-member-id");
  if (!memberId) return null;

  const { data } = await supabase
    .from("members")
    .select("id, name, grade, role, clubs, gender, preferred_tee")
    .eq("id", memberId)
    .single();

  return data as Member | null;
}

/** 認証必須。未認証なら 401 レスポンスを返す。 */
export async function requireAuth(
  request: NextRequest
): Promise<Member | NextResponse> {
  const member = await getAuthMember(request);
  if (!member) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  return member;
}

/** 管理者権限必須。未認証なら 401、権限不足なら 403 を返す。 */
export async function requireAdmin(
  request: NextRequest
): Promise<Member | NextResponse> {
  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;
  if (result.role !== "admin") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }
  return result;
}

/** requireAuth/requireAdmin の戻り値がエラーレスポンスかどうか判定 */
export function isAuthError(
  result: Member | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
