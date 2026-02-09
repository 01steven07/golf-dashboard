-- ==========================================
-- Add profile columns to members table
-- ==========================================

-- Add clubs as JSONB array (e.g., ["1W", "3W", "5W", "UT", "5I", "6I", "7I", "8I", "9I", "PW", "AW", "SW", "PT"])
ALTER TABLE members
ADD COLUMN clubs JSONB DEFAULT '[]'::jsonb;

-- Add gender column
ALTER TABLE members
ADD COLUMN gender TEXT DEFAULT 'male' CHECK (gender IN ('male', 'female', 'other'));

-- Add preferred tee color
ALTER TABLE members
ADD COLUMN preferred_tee TEXT DEFAULT 'white' CHECK (preferred_tee IN ('black', 'blue', 'white', 'red', 'green'));

-- Add comments for documentation
COMMENT ON COLUMN members.clubs IS 'Array of club types the member has in their bag (e.g., ["1W", "3W", "7I", "PW", "PT"])';
COMMENT ON COLUMN members.gender IS 'Gender: male, female, or other';
COMMENT ON COLUMN members.preferred_tee IS 'Preferred tee color: black, blue, white, red, green';
