CREATE TABLE IF NOT EXISTS adaptive_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  routine_id UUID REFERENCES routines(id) ON DELETE SET NULL,
  recommendation_type TEXT NOT NULL CHECK (
    recommendation_type IN ('progress', 'maintain', 'deload', 'simplify')
  ),
  summary TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  suggested_load_change_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  suggested_volume_change TEXT NOT NULL CHECK (
    suggested_volume_change IN ('increase', 'maintain', 'reduce')
  ),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adaptive_recommendations_user_created_at
  ON adaptive_recommendations(user_id, created_at DESC);
