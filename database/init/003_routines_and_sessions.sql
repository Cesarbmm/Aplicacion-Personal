CREATE TABLE IF NOT EXISTS routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT NOT NULL CHECK (goal IN ('hypertrophy', 'strength', 'weight_loss')),
  days_per_week INTEGER NOT NULL CHECK (days_per_week BETWEEN 2 AND 6),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_routines_one_active_per_user
  ON routines(user_id)
  WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS routine_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 6),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT routine_days_unique_day UNIQUE (routine_id, day_number)
);

CREATE TABLE IF NOT EXISTS routine_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_day_id UUID NOT NULL REFERENCES routine_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  exercise_order INTEGER NOT NULL CHECK (exercise_order >= 1),
  sets INTEGER NOT NULL CHECK (sets BETWEEN 1 AND 6),
  reps TEXT NOT NULL,
  rest_seconds INTEGER NOT NULL CHECK (rest_seconds > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT routine_exercises_unique_order UNIQUE (routine_day_id, exercise_order)
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  routine_day_id UUID NOT NULL REFERENCES routine_days(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_started_at
  ON workout_sessions(user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS workout_session_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  routine_exercise_id UUID NOT NULL REFERENCES routine_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL CHECK (set_number >= 1),
  target_reps INTEGER NOT NULL CHECK (target_reps >= 1),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  weight NUMERIC(10, 2),
  unit TEXT NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg', 'lb')),
  completed_at TIMESTAMPTZ,
  CONSTRAINT workout_session_sets_unique_set UNIQUE (workout_session_id, routine_exercise_id, set_number)
);

CREATE INDEX IF NOT EXISTS idx_workout_session_sets_session_id
  ON workout_session_sets(workout_session_id);
