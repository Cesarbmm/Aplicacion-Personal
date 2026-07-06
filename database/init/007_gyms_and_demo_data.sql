CREATE TABLE IF NOT EXISTS gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO gyms (id, name, slug)
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Sigma Gym Norte', 'sigma-gym-norte'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Titan Fitness', 'titan-fitness')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, slug = EXCLUDED.slug;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'athlete';

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('athlete', 'coach', 'admin'));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gym_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_gym_id_fkey'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_gym_id_fkey
      FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE SET NULL;
  END IF;
END
$$;

UPDATE users
SET gym_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    role = 'athlete'
WHERE id = '11111111-1111-4111-8111-111111111111';

CREATE INDEX IF NOT EXISTS idx_users_gym_role
  ON users(gym_id, role);

INSERT INTO exercises (
  name,
  muscle_group,
  movement_pattern,
  equipment,
  difficulty,
  goal_focus,
  tracking_type,
  coaching_cue
)
VALUES (
  'Flexiones',
  'Pecho',
  'Empuje horizontal',
  'Peso corporal',
  'beginner',
  'general',
  'bodyweight_reps',
  'Mantener tronco firme, pecho controlado y rango consistente.'
)
ON CONFLICT (name) DO UPDATE
SET
  equipment = EXCLUDED.equipment,
  tracking_type = EXCLUDED.tracking_type,
  coaching_cue = EXCLUDED.coaching_cue;

ALTER TABLE workout_sessions
  ALTER COLUMN routine_id DROP NOT NULL;

ALTER TABLE workout_sessions
  ALTER COLUMN routine_day_id DROP NOT NULL;

ALTER TABLE workout_sessions
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'live';

ALTER TABLE workout_sessions
  DROP CONSTRAINT IF EXISTS workout_sessions_source_check;

ALTER TABLE workout_sessions
  ADD CONSTRAINT workout_sessions_source_check
  CHECK (source IN ('live', 'post_workout', 'seed'));

ALTER TABLE workout_sessions
  ADD COLUMN IF NOT EXISTS raw_text TEXT;

ALTER TABLE workout_session_sets
  ALTER COLUMN routine_exercise_id DROP NOT NULL;

ALTER TABLE workout_session_sets
  ADD COLUMN IF NOT EXISTS exercise_id UUID;

UPDATE workout_session_sets wss
SET exercise_id = re.exercise_id
FROM routine_exercises re
WHERE wss.routine_exercise_id = re.id
  AND wss.exercise_id IS NULL;

ALTER TABLE workout_session_sets
  ALTER COLUMN exercise_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'workout_session_sets_exercise_id_fkey'
  ) THEN
    ALTER TABLE workout_session_sets
      ADD CONSTRAINT workout_session_sets_exercise_id_fkey
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE RESTRICT;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_workout_session_sets_exercise
  ON workout_session_sets(exercise_id);
