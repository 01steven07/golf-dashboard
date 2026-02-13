import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin, isAuthError } from "@/lib/api-auth";

// GET: 特定部員の詳細情報を返す（管理者のみ）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;

    const { data: member, error } = await supabase
      .from("members")
      .select("id, name, grade, role, gender, preferred_tee, clubs, created_at")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "部員が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Fetch member error:", error);
    return NextResponse.json(
      { error: "部員情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT: 部員情報の更新（管理者のみ）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, grade, role, gender, preferred_tee, clubs } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { error: "名前は必須です" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (grade !== undefined) {
      if (typeof grade !== "number" || grade < 1 || grade > 6) {
        return NextResponse.json(
          { error: "学年は1〜6の値を指定してください" },
          { status: 400 }
        );
      }
      updateData.grade = grade;
    }

    if (role !== undefined) {
      if (!["admin", "member"].includes(role)) {
        return NextResponse.json(
          { error: "Invalid role value" },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    if (gender !== undefined) {
      if (!["male", "female", "other"].includes(gender)) {
        return NextResponse.json(
          { error: "Invalid gender value" },
          { status: 400 }
        );
      }
      updateData.gender = gender;
    }

    if (preferred_tee !== undefined) {
      if (!["black", "blue", "white", "red", "green"].includes(preferred_tee)) {
        return NextResponse.json(
          { error: "Invalid preferred_tee value" },
          { status: 400 }
        );
      }
      updateData.preferred_tee = preferred_tee;
    }

    if (clubs !== undefined) {
      if (!Array.isArray(clubs)) {
        return NextResponse.json(
          { error: "clubs must be an array" },
          { status: 400 }
        );
      }
      updateData.clubs = clubs;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "更新するフィールドがありません" },
        { status: 400 }
      );
    }

    const { data: member, error } = await supabase
      .from("members")
      .update(updateData)
      .eq("id", id)
      .select("id, name, grade, role, gender, preferred_tee, clubs")
      .single();

    if (error) {
      console.error("Update member error:", error);
      return NextResponse.json(
        { error: "部員情報の更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json(
      { error: "部員情報の更新に失敗しました" },
      { status: 500 }
    );
  }
}
