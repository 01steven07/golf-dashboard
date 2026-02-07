-- ==========================================
-- Golf Dashboard - Initial Schema Migration
-- ==========================================

-- Enum for member roles
CREATE TYPE member_role AS ENUM ('admin', 'member');

-- Enum for fairway result
CREATE TYPE fairway_result AS ENUM ('keep', 'left', 'right');

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade INTEGER NOT NULL,
  pin_hash TEXT NOT NULL,
  role member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  pref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rounds table
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  tee_color TEXT NOT NULL DEFAULT 'White',
  weather TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scores table (1 row per hole, 18 rows per round)
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  par INTEGER NOT NULL CHECK (par IN (3, 4, 5)),
  score INTEGER NOT NULL CHECK (score > 0),
  putts INTEGER NOT NULL DEFAULT 0 CHECK (putts >= 0),
  fairway_result fairway_result NOT NULL DEFAULT 'keep',
  ob INTEGER NOT NULL DEFAULT 0 CHECK (ob >= 0),
  bunker INTEGER NOT NULL DEFAULT 0 CHECK (bunker >= 0),
  penalty INTEGER NOT NULL DEFAULT 0 CHECK (penalty >= 0),
  UNIQUE (round_id, hole_number)
);

-- Indexes for common queries
CREATE INDEX idx_rounds_member_id ON rounds(member_id);
CREATE INDEX idx_rounds_date ON rounds(date DESC);
CREATE INDEX idx_scores_round_id ON scores(round_id);

-- RLS disabled for MVP (simple PIN-based auth)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Allow all operations for MVP
CREATE POLICY "Allow all" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON rounds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON scores FOR ALL USING (true) WITH CHECK (true);
