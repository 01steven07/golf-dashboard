-- ==========================================
-- Golf Dashboard - Sub Course Linking Migration
-- ==========================================
-- rounds に played_sub_course_ids を追加し、scores に course_hole_id を追加。
-- 旧カラム (out_course_name, in_course_name, ext_course_labels) はそのまま残す。

-- 1. rounds: ラウンドでプレイしたサブコースのID配列
ALTER TABLE rounds
  ADD COLUMN IF NOT EXISTS played_sub_course_ids UUID[] NOT NULL DEFAULT '{}';

-- 2. scores: 各スコアが対応するコースホールのID
ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS course_hole_id UUID REFERENCES course_holes(id);

-- 3. scores.course_hole_id にインデックス（ホール別分析の高速化）
CREATE INDEX IF NOT EXISTS idx_scores_course_hole_id
  ON scores(course_hole_id)
  WHERE course_hole_id IS NOT NULL;

-- 4. rounds.played_sub_course_ids にGINインデックス（配列検索用）
CREATE INDEX IF NOT EXISTS idx_rounds_played_sub_course_ids
  ON rounds USING GIN (played_sub_course_ids)
  WHERE played_sub_course_ids != '{}';
