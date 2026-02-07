-- Add distance column to scores table
-- Distance is in yards, nullable, valid range 1-700

ALTER TABLE scores
ADD COLUMN distance INTEGER CHECK (distance IS NULL OR (distance > 0 AND distance <= 700));

COMMENT ON COLUMN scores.distance IS 'Hole distance in yards';
