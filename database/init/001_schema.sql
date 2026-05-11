CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  goal TEXT,
  experience_level TEXT,
  days_per_week INTEGER,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_profiles_goal_check
    CHECK (goal IS NULL OR goal IN ('hypertrophy', 'strength', 'weight_loss')),
  CONSTRAINT user_profiles_experience_level_check
    CHECK (experience_level IS NULL OR experience_level IN ('beginner', 'intermediate', 'advanced')),
  CONSTRAINT user_profiles_days_per_week_check
    CHECK (days_per_week IS NULL OR days_per_week BETWEEN 2 AND 6),
  CONSTRAINT user_profiles_completion_check
    CHECK (
      (onboarding_completed = FALSE AND goal IS NULL AND experience_level IS NULL AND days_per_week IS NULL)
      OR
      (onboarding_completed = TRUE AND goal IS NOT NULL AND experience_level IS NOT NULL AND days_per_week IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  muscle_group TEXT NOT NULL,
  movement_pattern TEXT NOT NULL,
  equipment TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  goal_focus TEXT NOT NULL CHECK (goal_focus IN ('hypertrophy', 'strength', 'weight_loss', 'general')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_goal_focus ON exercises(goal_focus);
