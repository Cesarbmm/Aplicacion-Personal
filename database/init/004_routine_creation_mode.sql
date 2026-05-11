ALTER TABLE routines
  ADD COLUMN IF NOT EXISTS creation_mode TEXT NOT NULL DEFAULT 'coach';

ALTER TABLE routines
  DROP CONSTRAINT IF EXISTS routines_creation_mode_check;

ALTER TABLE routines
  ADD CONSTRAINT routines_creation_mode_check
  CHECK (creation_mode IN ('coach', 'manual'));
