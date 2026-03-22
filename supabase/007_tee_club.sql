-- Add tee_club column to scores table
-- Stores the club used for tee shot (simple input mode)
ALTER TABLE scores
ADD COLUMN tee_club TEXT DEFAULT NULL;

COMMENT ON COLUMN scores.tee_club IS 'Club used for the tee shot (e.g., "1W", "3W", "5I"). Used by simple input mode where shots_detail is null.';

-- Also update migration.sql to include this column
