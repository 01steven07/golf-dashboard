-- ==========================================
-- Golf Dashboard - Full Schema (Consolidated)
-- ==========================================
-- 初回デプロイ時にこのファイル1本で最新スキーマを構築できます。
-- 個別マイグレーション (002〜006) は差分履歴として残しています。

-- ==========================================
-- Enums
-- ==========================================

CREATE TYPE member_role AS ENUM ('admin', 'member');

CREATE TYPE fairway_result AS ENUM ('keep', 'left', 'right');

-- ==========================================
-- Members table
-- ==========================================

CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade INTEGER NOT NULL,
  pin_hash TEXT NOT NULL,
  role member_role NOT NULL DEFAULT 'member',
  clubs JSONB DEFAULT '[]'::jsonb,
  gender TEXT DEFAULT 'male' CHECK (gender IN ('male', 'female', 'other')),
  preferred_tee TEXT DEFAULT 'white' CHECK (preferred_tee IN ('black', 'blue', 'white', 'red', 'green')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN members.clubs IS 'Array of club types the member has in their bag (e.g., ["1W", "3W", "7I", "PW", "PT"])';
COMMENT ON COLUMN members.gender IS 'Gender: male, female, or other';
COMMENT ON COLUMN members.preferred_tee IS 'Preferred tee color: black, blue, white, red, green';

-- ==========================================
-- Courses table
-- ==========================================

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  pref TEXT,
  green_types TEXT[],
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- Course tees (バック/レギュラー/レディース等)
-- ==========================================

CREATE TABLE course_tees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- Course sub-courses (OUT/IN, 東/西/南/北)
-- ==========================================

CREATE TABLE course_sub_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hole_count INTEGER NOT NULL DEFAULT 9,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- Course holes (ホール別情報)
-- ==========================================

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

-- ==========================================
-- Rounds table
-- ==========================================

CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  tee_color TEXT NOT NULL DEFAULT 'White',
  weather TEXT,
  image_url TEXT,
  out_course_name TEXT,
  in_course_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- Scores table (1 row per hole)
-- ==========================================

CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 36),
  par INTEGER NOT NULL CHECK (par BETWEEN 3 AND 6),
  distance INTEGER CHECK (distance IS NULL OR (distance > 0 AND distance <= 700)),
  score INTEGER NOT NULL CHECK (score > 0),
  putts INTEGER NOT NULL DEFAULT 0 CHECK (putts >= 0),
  fairway_result fairway_result NOT NULL DEFAULT 'keep',
  ob INTEGER NOT NULL DEFAULT 0 CHECK (ob >= 0),
  bunker INTEGER NOT NULL DEFAULT 0 CHECK (bunker >= 0),
  penalty INTEGER NOT NULL DEFAULT 0 CHECK (penalty >= 0),
  pin_position TEXT CHECK (pin_position IS NULL OR pin_position IN (
    'front-left', 'front-center', 'front-right',
    'middle-left', 'center', 'middle-right',
    'back-left', 'back-center', 'back-right'
  )),
  shots_detail JSONB,
  UNIQUE (round_id, hole_number)
);

-- ==========================================
-- Indexes
-- ==========================================

CREATE INDEX idx_rounds_member_id ON rounds(member_id);
CREATE INDEX idx_rounds_date ON rounds(date DESC);
CREATE INDEX idx_scores_round_id ON scores(round_id);
CREATE INDEX idx_course_tees_course_id ON course_tees(course_id);
CREATE INDEX idx_course_sub_courses_course_id ON course_sub_courses(course_id);
CREATE INDEX idx_course_holes_sub_course_id ON course_holes(sub_course_id);

-- ==========================================
-- RLS (allow all for MVP)
-- ==========================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_tees ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sub_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_holes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON rounds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON course_tees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON course_sub_courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON course_holes FOR ALL USING (true) WITH CHECK (true);
