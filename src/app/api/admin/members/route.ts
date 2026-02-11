import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: 全部員一覧を返す
export async function GET() {
  try {
    const { data: members, error } = await supabase
      .from("members")
      .select("id, name, grade, role, gender, preferred_tee, clubs, created_at")
      .order("grade", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Fetch members error:", error);
      return NextResponse.json(
        { error: "部員一覧の取得に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Fetch members error:", error);
    return NextResponse.json(
      { error: "部員一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: 部員を削除
export async function DELETE(request: NextRequest) {
  try {
    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("members")
      .delete()
      .eq("id", memberId);

    if (error) {
      console.error("Delete member error:", error);
      return NextResponse.json(
        { error: "部員の削除に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete member error:", error);
    return NextResponse.json(
      { error: "部員の削除に失敗しました" },
      { status: 500 }
    );
  }
}
