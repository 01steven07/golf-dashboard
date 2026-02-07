import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { member_id, pin } = await request.json();

    if (!member_id || !pin) {
      return NextResponse.json(
        { error: "部員IDとPINコードを入力してください" },
        { status: 400 }
      );
    }

    // Fetch member by ID
    const { data: member, error } = await supabase
      .from("members")
      .select("id, name, grade, pin_hash, role")
      .eq("id", member_id)
      .single();

    if (error || !member) {
      return NextResponse.json(
        { error: "部員が見つかりません" },
        { status: 404 }
      );
    }

    // Verify PIN
    const isValid = await bcrypt.compare(pin, member.pin_hash);

    if (!isValid) {
      return NextResponse.json(
        { error: "PINコードが正しくありません" },
        { status: 401 }
      );
    }

    // Return member data (without pin_hash)
    return NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        grade: member.grade,
        role: member.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "ログイン処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}
