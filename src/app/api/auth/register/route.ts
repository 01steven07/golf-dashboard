import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

const SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    const { name, grade, gender, preferred_tee, pin, clubs } = await request.json();

    // Validation
    if (!name || !grade || !pin) {
      return NextResponse.json(
        { error: "すべての項目を入力してください" },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "名前を入力してください" },
        { status: 400 }
      );
    }

    if (typeof grade !== "number" || grade < 1 || grade > 6) {
      return NextResponse.json(
        { error: "学年は1〜6の数値で入力してください" },
        { status: 400 }
      );
    }

    if (typeof pin !== "string" || !/^\d{4,8}$/.test(pin)) {
      return NextResponse.json(
        { error: "PINコードは4〜8桁の数字で入力してください" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const { data: existing } = await supabase
      .from("members")
      .select("id")
      .eq("name", name.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "この名前は既に登録されています" },
        { status: 409 }
      );
    }

    // Hash PIN
    const pin_hash = await bcrypt.hash(pin, SALT_ROUNDS);

    // Insert member
    const { data: member, error } = await supabase
      .from("members")
      .insert({
        name: name.trim(),
        grade,
        gender: gender || "male",
        preferred_tee: preferred_tee || "white",
        pin_hash,
        role: "member",
        clubs: Array.isArray(clubs) ? clubs : [],
      })
      .select("id, name, grade, role, clubs, gender, preferred_tee")
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json(
        { error: "登録に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "登録処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}
