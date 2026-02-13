import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/api-auth";

/** GET /api/courses/[id] - コース詳細取得 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: course, error } = await supabase
      .from("courses")
      .select(`
        *,
        course_tees(*),
        course_sub_courses(*, course_holes(*))
      `)
      .eq("id", id)
      .single();

    if (error || !course) {
      return NextResponse.json(
        { error: "コースが見つかりません" },
        { status: 404 }
      );
    }

    // レスポンスのキー名を変換 + ソート
    const tees = (course.course_tees ?? [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
    const sub_courses = (course.course_sub_courses ?? [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((sc: { course_holes?: { hole_number: number }[] }) => {
        const { course_holes, ...rest } = sc;
        return {
          ...rest,
          holes: (course_holes ?? [])
            .sort((a: { hole_number: number }, b: { hole_number: number }) => a.hole_number - b.hole_number),
        };
      });

    const { course_tees: _tees, course_sub_courses: _sc, ...courseBase } = course;

    return NextResponse.json({
      ...courseBase,
      tees,
      sub_courses,
    });
  } catch (error) {
    console.error("Course GET error:", error);
    return NextResponse.json(
      { error: "コース詳細の取得に失敗しました" },
      { status: 500 }
    );
  }
}

/** PUT /api/courses/[id] - コース更新 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, pref, source_url, green_types, tees, sub_courses } = body;

    // コース更新
    const { error: courseError } = await supabase
      .from("courses")
      .update({
        name,
        pref: pref || null,
        source_url: source_url || null,
        green_types: green_types || null,
      })
      .eq("id", id);

    if (courseError) throw courseError;

    // ティー: 既存削除→再登録
    await supabase.from("course_tees").delete().eq("course_id", id);
    if (tees && tees.length > 0) {
      const teeRows = tees.map(
        (t: { name: string; color: string; sort_order: number }) => ({
          course_id: id,
          name: t.name,
          color: t.color || null,
          sort_order: t.sort_order,
        })
      );
      const { error: teeError } = await supabase
        .from("course_tees")
        .insert(teeRows);
      if (teeError) throw teeError;
    }

    // サブコース: 既存のホールを含めてカスケード削除→再登録
    await supabase.from("course_sub_courses").delete().eq("course_id", id);
    if (sub_courses && sub_courses.length > 0) {
      for (const sc of sub_courses) {
        const { data: subCourse, error: scError } = await supabase
          .from("course_sub_courses")
          .insert({
            course_id: id,
            name: sc.name,
            hole_count: sc.hole_count || 9,
            sort_order: sc.sort_order,
          })
          .select()
          .single();

        if (scError) throw scError;

        if (sc.holes && sc.holes.length > 0) {
          const holeRows = sc.holes.map(
            (h: {
              hole_number: number;
              par: number;
              handicap: number | null;
              distances: Record<string, number>;
            }) => ({
              sub_course_id: subCourse.id,
              hole_number: h.hole_number,
              par: h.par,
              handicap: h.handicap,
              distances: h.distances || {},
            })
          );
          const { error: holeError } = await supabase
            .from("course_holes")
            .insert(holeRows);
          if (holeError) throw holeError;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Course PUT error:", error);
    return NextResponse.json(
      { error: "コースの更新に失敗しました" },
      { status: 500 }
    );
  }
}

/** DELETE /api/courses/[id] - コース削除 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;

    // ラウンドで使用されているか確認
    const { data: rounds } = await supabase
      .from("rounds")
      .select("id")
      .eq("course_id", id)
      .limit(1);

    if (rounds && rounds.length > 0) {
      return NextResponse.json(
        { error: "このコースはラウンドデータで使用されているため削除できません" },
        { status: 409 }
      );
    }

    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Course DELETE error:", error);
    return NextResponse.json(
      { error: "コースの削除に失敗しました" },
      { status: 500 }
    );
  }
}
