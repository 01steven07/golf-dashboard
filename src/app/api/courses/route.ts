import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { CourseWithDetails } from "@/types/database";
import { requireAuth, isAuthError } from "@/lib/api-auth";

/** GET /api/courses - コース一覧取得 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get("detailed") === "true";

    if (detailed) {
      // 詳細込みで取得
      const { data: courses, error } = await supabase
        .from("courses")
        .select("*")
        .order("name");

      if (error) throw error;

      const result: CourseWithDetails[] = [];
      for (const course of courses || []) {
        const { data: tees } = await supabase
          .from("course_tees")
          .select("*")
          .eq("course_id", course.id)
          .order("sort_order");

        const { data: subCourses } = await supabase
          .from("course_sub_courses")
          .select("*")
          .eq("course_id", course.id)
          .order("sort_order");

        const subCoursesWithHoles = [];
        for (const sc of subCourses || []) {
          const { data: holes } = await supabase
            .from("course_holes")
            .select("*")
            .eq("sub_course_id", sc.id)
            .order("hole_number");

          subCoursesWithHoles.push({
            ...sc,
            holes: holes || [],
          });
        }

        result.push({
          ...course,
          tees: tees || [],
          sub_courses: subCoursesWithHoles,
        });
      }

      return NextResponse.json(result);
    }

    // シンプル一覧
    const { data: courses, error } = await supabase
      .from("courses")
      .select("*")
      .order("name");

    if (error) throw error;

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Courses GET error:", error);
    return NextResponse.json(
      { error: "コース一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

/** POST /api/courses - コース新規登録（全データ一括） */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const { name, pref, source_url, green_types, tees, sub_courses } = body;

    if (!name) {
      return NextResponse.json(
        { error: "コース名は必須です" },
        { status: 400 }
      );
    }

    // コース作成
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        name,
        pref: pref || null,
        source_url: source_url || null,
        green_types: green_types || null,
      })
      .select()
      .single();

    if (courseError) {
      if (courseError.code === "23505") {
        return NextResponse.json(
          { error: "同名のコースが既に登録されています" },
          { status: 409 }
        );
      }
      throw courseError;
    }

    // ティー登録
    if (tees && tees.length > 0) {
      const teeRows = tees.map(
        (t: { name: string; color: string; sort_order: number }) => ({
          course_id: course.id,
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

    // サブコース＋ホール登録
    if (sub_courses && sub_courses.length > 0) {
      for (const sc of sub_courses) {
        const { data: subCourse, error: scError } = await supabase
          .from("course_sub_courses")
          .insert({
            course_id: course.id,
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

    return NextResponse.json({ id: course.id }, { status: 201 });
  } catch (error) {
    console.error("Courses POST error:", error);
    return NextResponse.json(
      { error: "コースの登録に失敗しました" },
      { status: 500 }
    );
  }
}
