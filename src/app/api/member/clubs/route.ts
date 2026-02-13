import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/api-auth";

// GET: Fetch member's clubs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId is required" },
        { status: 400 }
      );
    }

    const { data: member, error } = await supabase
      .from("members")
      .select("clubs, gender, preferred_tee")
      .eq("id", memberId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      clubs: member.clubs || [],
      gender: member.gender || "male",
      preferred_tee: member.preferred_tee || "white",
    });
  } catch (error) {
    console.error("Get clubs error:", error);
    return NextResponse.json(
      { error: "プロフィール情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT: Update member's profile (clubs, gender, preferred_tee)
export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { memberId, clubs, gender, preferred_tee } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId is required" },
        { status: 400 }
      );
    }

    // 自分のプロフィールのみ更新可能
    if (memberId !== auth.id) {
      return NextResponse.json(
        { error: "他のユーザーのプロフィールは更新できません" },
        { status: 403 }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (clubs !== undefined) {
      if (!Array.isArray(clubs)) {
        return NextResponse.json(
          { error: "clubs must be an array" },
          { status: 400 }
        );
      }
      updateData.clubs = clubs;
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

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data: member, error } = await supabase
      .from("members")
      .update(updateData)
      .eq("id", memberId)
      .select("id, name, grade, role, clubs, gender, preferred_tee")
      .single();

    if (error) {
      console.error("Update profile error:", error);
      return NextResponse.json(
        { error: "プロフィール情報の更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "プロフィール情報の更新に失敗しました" },
      { status: 500 }
    );
  }
}
