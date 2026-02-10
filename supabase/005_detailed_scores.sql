-- 詳細ショット入力対応のスキーマ変更

-- hole_number: 18→36 (27ホールラウンド対応)
ALTER TABLE scores DROP CONSTRAINT scores_hole_number_check;
ALTER TABLE scores ADD CONSTRAINT scores_hole_number_check CHECK (hole_number BETWEEN 1 AND 36);

-- par: 3,4,5 → 3,4,5,6
ALTER TABLE scores DROP CONSTRAINT scores_par_check;
ALTER TABLE scores ADD CONSTRAINT scores_par_check CHECK (par BETWEEN 3 AND 6);

-- course_id: NOT NULL → nullable（手動入力コース対応）
ALTER TABLE rounds ALTER COLUMN course_id DROP NOT NULL;

-- shots_detail: ショット配列をJSONBで保存（MVP）
ALTER TABLE scores ADD COLUMN IF NOT EXISTS shots_detail JSONB;
