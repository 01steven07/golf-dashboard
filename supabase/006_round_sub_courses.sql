-- ==========================================
-- Golf Dashboard - Round Sub-Course Names
-- ==========================================
-- ラウンドに前半・後半のコース名を保存（36H以上のゴルフ場で東/西/南/北等を区別するため）

ALTER TABLE rounds ADD COLUMN IF NOT EXISTS out_course_name TEXT;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS in_course_name TEXT;
