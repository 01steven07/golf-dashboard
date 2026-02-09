-- ==========================================
-- Golf Dashboard - Course Details Migration
-- ==========================================

-- Add new columns to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS green_types TEXT[];
ALTER TABLE courses ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Course tees (バック/レギュラー/レディース等)
CREATE TABLE course_tees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Course sub-courses (OUT/IN, 東/西/南/北)
CREATE TABLE course_sub_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hole_count INTEGER NOT NULL DEFAULT 9,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Course holes (ホール別情報)
CREATE TABLE course_holes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_course_id UUID NOT NULL REFERENCES course_sub_courses(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number >= 1),
  par INTEGER NOT NULL CHECK (par BETWEEN 3 AND 6),
  handicap INTEGER,
  distances JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sub_course_id, hole_number)
);

-- Indexes
CREATE INDEX idx_course_tees_course_id ON course_tees(course_id);
CREATE INDEX idx_course_sub_courses_course_id ON course_sub_courses(course_id);
CREATE INDEX idx_course_holes_sub_course_id ON course_holes(sub_course_id);

-- RLS (allow all for MVP)
ALTER TABLE course_tees ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sub_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_holes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON course_tees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON course_sub_courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON course_holes FOR ALL USING (true) WITH CHECK (true);
